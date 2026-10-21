"""Vendor the shipped trial-forecast env from browser-use/rl-env-use into src/data/*.json.

Run from a clone of the repo with its package installed (so the filters and the
paired bootstrap are the repo's own code, not a re-implementation):

    git clone https://github.com/browser-use/rl-env-use && cd rl-env-use
    uv venv && uv pip install -e .
    .venv/bin/python ../tech-demos/apps/rl-env-use-playground/scripts/extract.py . ../tech-demos/apps/rl-env-use-playground/src/data
"""

import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

from rl_env_use.audit import paired
from rl_env_use.graders import prob_of
from rl_env_use.rollout import CASE_SYS
from rl_env_use.tasks import balanced, keep, load_tasks

repo, out = Path(sys.argv[1]), Path(sys.argv[2])
env = repo / 'envs' / 'trial-forecast'
out.mkdir(parents=True, exist_ok=True)
commit = subprocess.run(['git', '-C', str(repo), 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()

# The 35 tasks the env serves today: the repo's own keep() + balanced() filters (same as Env(env_dir)).
tasks = balanced([t for t in load_tasks(env) if keep(t)])
kept = {t['id']: t for t in tasks}
state = json.loads((env / 'climb-qwen-35b' / '_state.json').read_text())
train = [i for i in state['train_ids'] if i in kept]
test = [i for i in state['test_ids'] if i in kept]
case_of = {i: kept[i]['case'] for i in kept}


def rows(path):
	return [json.loads(line) for line in open(path) if line.strip()]


def runs(path, reps=None):
	"""Per-task list of {rep, p, score} from a results.jsonl (status ok only)."""
	by = defaultdict(list)
	for r in rows(path):
		if r.get('status') != 'ok' or r['prompt_id'] not in kept:
			continue
		if reps is not None and r['rep'] not in reps:
			continue
		by[r['prompt_id']].append({'rep': r['rep'], 'answer': r['meta'].get('answer'), 'p': prob_of(r['meta'].get('answer')), 'score': round(float(r['grade']['correct']), 4)})
	return {k: sorted(v, key=lambda x: x['rep']) for k, v in by.items()}


MODELS = {
	'qwenBase': ('Qwen 3.6 35B-A3B (base prompt)', env / 'climb-qwen-35b/baseline/results.jsonl'),
	'qwenTuned': ('Qwen 3.6 35B-A3B (climbed prompt v3)', env / 'climb-qwen-35b/v3/results.jsonl'),
	'opus': ('Claude Opus 5.5', env / 'models/v2/results.jsonl'),
	'gptAstra': ('GPT-6 Astra', env / 'models/v3/results.jsonl'),
}
model_runs = {k: runs(p) for k, (_, p) in MODELS.items()}
model_ids = {k: rows(p)[0]['model'] for k, (_, p) in MODELS.items()}


def trunc(s, n):
	s = s or ''
	return s if len(s) <= n else s[:n].rstrip() + ' …'


def nct(case):
	m = re.search(r'NCT\d{8}', case)
	return m.group() if m else case


def evidence(t):
	"""Results passages the gold rests on, one entry per URL (quotes from the same page are joined)."""
	by = {}
	for e in t.get('evidence', []):
		by.setdefault(e.get('url'), []).append(e.get('quote') or '')
	return [{'url': u, 'quote': trunc('\n…\n'.join(dict.fromkeys(q)), 2400)} for u, q in by.items()]


out_tasks = []
for i in [*test, *train]:
	t = kept[i]
	out_tasks.append(
		{
			'id': i,
			'case': t['case'],
			'split': 'test' if i in test else 'train',
			'category': t['category'],
			'difficulty': t['difficulty'],
			'prompt': t['prompt'],
			'context': t['context'],
			'gold': t['answer'],
			'whyHard': t.get('why_hard', ''),
			'evidence': evidence(t),
			'models': {k: model_runs[k].get(i, []) for k in MODELS},
		}
	)


def mean_of(d, ids):
	ids = [i for i in ids if i in d]
	return round(sum(d[i] for i in ids) / len(ids), 4) if ids else None


def task_means(rs, reps=None):
	return {i: sum(x['score'] for x in v if reps is None or x['rep'] in reps) / max(1, len([x for x in v if reps is None or x['rep'] in reps])) for i, v in rs.items()}


headline = {}
for k in MODELS:
	tm = task_means(model_runs[k])
	headline[k] = {'label': MODELS[k][0], 'model': model_ids[k], 'all': mean_of(tm, list(kept)), 'test': mean_of(tm, test), 'train': mean_of(tm, train)}

# The climb's headline: fresh test reps 4-7 for both arms (climb.py final), regraded on the 16 test tasks still served.
reps = state['final']['reps']
fresh = set(range(reps, 2 * reps))
b2 = {i: v for i, v in task_means(runs(MODELS['qwenBase'][1], fresh)).items() if i in test}
n2 = {i: v for i, v in task_means(runs(MODELS['qwenTuned'][1], fresh)).items() if i in test}
final_regraded = {'baseline_test': mean_of(b2, test), 'best_test': mean_of(n2, test), 'paired': paired(b2, n2, case_of), 'n_test': len(test)}

variants = {}
for d in sorted((env / 'climb-qwen-35b').iterdir()):
	if d.is_dir():
		variants[d.name] = {'prompt': (d / 'prompt.txt').read_text(), 'change': (d / 'change.md').read_text().strip()}

meta = {
	'source': 'https://github.com/browser-use/rl-env-use',
	'commit': commit,
	'env': 'envs/trial-forecast',
	'license': 'MIT',
	'nTasks': len(kept),
	'nCases': len({t['case'] for t in tasks}),
	'gold': {'yes': sum(t['answer'] == 'yes' for t in tasks), 'no': sum(t['answer'] == 'no' for t in tasks)},
	'nTrials': len({nct(t['case']) for t in tasks}),
	'trialsOnBothSides': sorted({nct(kept[i]['case']) for i in train} & {nct(kept[i]['case']) for i in test}),
	'nTrain': len(train),
	'nTest': len(test),
	'headline': headline,
	'finalRegraded': final_regraded,
	'stats': json.loads((repo / 'envs' / 'stats.json').read_text())['trial-forecast'],
}
hill = {k: state[k] for k in ('policy', 'proposer', 'reps', 'confidence', 'usd', 'baseline', 'final', 'rounds', 'incumbent', 'best')}
hill['caseSys'] = CASE_SYS
hill['variants'] = variants
hill['nTrainAtClimb'] = len(state['train_ids'])
hill['nTestAtClimb'] = len(state['test_ids'])

(out / 'tasks.json').write_text(json.dumps(out_tasks, ensure_ascii=False))
(out / 'meta.json').write_text(json.dumps(meta, indent=1, ensure_ascii=False))
(out / 'hillclimb.json').write_text(json.dumps(hill, indent=1, ensure_ascii=False))
print(json.dumps({'tasks': len(out_tasks), 'train': len(train), 'test': len(test), 'headline': headline, 'final': final_regraded}, indent=1))
