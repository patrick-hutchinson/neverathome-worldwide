import { useEffect, useState } from "react";

import { formatFileSize, getSubmissionDisplayName } from "@/lib/submissions/format";
import styles from "@/styles/AdminSubmissions.module.scss";

const exportBatchSize = 25;

const AdminSubmissionsPage = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submissions, setSubmissions] = useState([]);

  const loadSubmissions = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/submissions");
      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Could not load submissions.");
      }

      setIsAuthenticated(true);
      setSubmissions(result.submissions || []);
    } catch (nextError) {
      setError(nextError.message || "Could not load submissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        body: JSON.stringify({ password }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Login failed.");
      }

      setPassword("");
      setIsAuthenticated(true);
      await loadSubmissions();
    } catch (nextError) {
      setError(nextError.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDownload = (href) => {
    window.location.href = href;
    window.setTimeout(loadSubmissions, 2000);
  };

  if (!isAuthenticated) {
    return (
      <main className={styles.adminPage} typo="h4">
        <form className={styles.loginForm} onSubmit={handleLogin}>
          <label>
            <span>Admin Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <button disabled={isLoading || !password} type="submit">
            Enter
          </button>
          {error ? (
            <p className={styles.error} typo="h6">
              {error}
            </p>
          ) : null}
        </form>
      </main>
    );
  }

  const downloadedCount = submissions.filter((submission) => submission.downloaded_at).length;
  const newCount = submissions.length - downloadedCount;
  const batchCount = Math.ceil(submissions.length / exportBatchSize);

  return (
    <main className={styles.adminPage} typo="h4">
      <header className={styles.header}>
        <div>
          <h2 typo="h4">Submissions</h2>
          <p typo="h6">
            {submissions.length} total, {newCount} new, {downloadedCount} downloaded
          </p>
        </div>
        <div className={styles.actions}>
          <button disabled={isLoading} onClick={loadSubmissions} type="button">
            Refresh
          </button>
          <button
            disabled={newCount === 0}
            onClick={() => triggerDownload(`/api/admin/submissions/export?mode=new&limit=${exportBatchSize}`)}
            type="button"
          >
            Download New
          </button>
        </div>
      </header>

      {batchCount > 0 ? (
        <nav className={styles.batches} typo="h6">
          {Array.from({ length: batchCount }, (_, batchIndex) => {
            const offset = batchIndex * exportBatchSize;
            const start = offset + 1;
            const end = Math.min(offset + exportBatchSize, submissions.length);

            return (
              <button
                key={offset}
                onClick={() =>
                  triggerDownload(`/api/admin/submissions/export?limit=${exportBatchSize}&offset=${offset}`)
                }
                type="button"
              >
                Download {start}-{end}
              </button>
            );
          })}
        </nav>
      ) : null}

      {error ? (
        <p className={styles.error} typo="h6">
          {error}
        </p>
      ) : null}

      <div className={styles.list}>
        {submissions.length === 0 ? (
          <p className={styles.empty}>No submissions yet.</p>
        ) : (
          submissions.map((submission) => {
            const files = Object.values(submission.files || {});
            const totalFileSize = files.reduce((totalSize, file) => totalSize + (Number(file?.size) || 0), 0);

            return (
              <article className={styles.submission} key={submission.id}>
                <div>
                  <h3 typo="h4">{getSubmissionDisplayName(submission)}</h3>
                  <p typo="h6">{submission.email}</p>
                </div>
                <div className={styles.submissionMeta} typo="h6">
                  <p>{new Date(submission.created_at).toLocaleString()}</p>
                  <p>{formatFileSize(totalFileSize)}</p>
                  <p className={submission.downloaded_at ? styles.downloaded : styles.new}>
                    {submission.downloaded_at
                      ? `Downloaded ${submission.download_count || 1}x`
                      : "New"}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
};

export default AdminSubmissionsPage;
