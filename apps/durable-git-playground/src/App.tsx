import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RepoProvider } from "@/context/repo";
import { Layout } from "@/components/Layout";
import { Summary } from "@/views/Summary";
import { Log } from "@/views/Log";
import { TreeView } from "@/views/Tree";
import { BlobView } from "@/views/Blob";
import { CommitView } from "@/views/Commit";
import { PushWalkthrough } from "@/views/PushWalkthrough";

export default function App() {
  return (
    <RepoProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Summary />} />
            <Route path="log" element={<Log />} />
            <Route path="tree/*" element={<TreeView />} />
            <Route path="blob/*" element={<BlobView />} />
            <Route path="commit/:oid" element={<CommitView />} />
            <Route path="push" element={<PushWalkthrough />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RepoProvider>
  );
}
