import {
  Button,
  Checkbox,
  Container,
  Heading,
  Label,
  Prompt,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, statusColor, statusLabel, type Job } from "../../../lib/api";

type Detail = {
  job: Job;
  failed_batches: number;
  error_count: number;
  batches: {
    id: string;
    idx: number;
    size: number;
    status: string;
    attempts: number;
    failed_count: number;
    error: string | null;
  }[];
  errors: {
    id: string;
    stage: string;
    severity: string;
    product_key: string | null;
    row_number: number | null;
    message: string;
    created_at: string;
  }[];
};
type DeletionPreview = {
  count: number;
  sample: { id: string; title: string }[];
  token: string;
};
type Preview = {
  sample: any[];
  warning_count: number;
  error_count: number;
  deletion_preview?: DeletionPreview;
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <Text size="small" className="text-ui-fg-subtle">
      {label}
    </Text>
    <Text weight="plus">{value}</Text>
  </div>
);

export default function ImportDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [freshMode, setFreshMode] = useState(false); // unchecked = merge (create or update)
  // Dialog state is split so closing the dialog never nulls the data it renders or the token the click needs.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletion, setDeletion] = useState<DeletionPreview>({
    count: 0,
    sample: [],
    token: "",
  });
  const [previewLoading, setPreviewLoading] = useState(false); // spinner while the deletion preview API runs
  const freshToken = useRef<string | null>(null);

  const { data } = useQuery({
    queryKey: ["import", id],
    queryFn: () => api<Detail>(`/${id}`),
    refetchInterval: (q) => {
      const j = q.state.data?.job;
      return j &&
        (j.status === "processing" || j.status === "pending") &&
        j.stage !== "uploaded" &&
        j.stage !== "preprocessed"
        ? 3000
        : false;
    },
  });
  const preview = useQuery({
    queryKey: ["import-preview", id],
    queryFn: () => api<Preview>(`/${id}/preview`),
    enabled: showPreview,
  });

  const act = (path: string, ok: string, body?: unknown) => ({
    mutationFn: () =>
      api(`/${id}/${path}`, {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }),
    onSuccess: () => {
      toast.success(ok);
      qc.invalidateQueries({ queryKey: ["import", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const preprocess = useMutation(act("preprocess", "Preprocessing started"));
  const startMerge = useMutation(
    act("start", "Import started", { mode: "merge" }),
  );
  const retry = useMutation(act("retry", "Failed batches re-queued"));
  const cont = useMutation(act("continue", "Job resumed from last checkpoint"));
  const stop = useMutation(act("stop", "Stopping after the current batch…"));
  const freshBody = (token: string) =>
    JSON.stringify({
      mode: "fresh",
      confirm_deletion: { token, confirm: true },
    });
  const startFresh = useMutation({
    mutationFn: (token: string) =>
      api(`/${id}/start`, { method: "POST", body: freshBody(token) }),
    onSuccess: () => {
      toast.success("Fresh import started");
      freshToken.current = null;
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["import", id] });
    },
    onError: (e: any) => {
      if (e.status === 409 && e.body?.deletion_preview) {
        freshToken.current = e.body.deletion_preview.token;
        setDeletion(e.body.deletion_preview);
        setDialogOpen(true);
        toast.warning(
          "The set of products to delete changed. Please review again.",
        );
      } else toast.error(e.message);
    },
  });

  const openFresh = async () => {
    setPreviewLoading(true);
    try {
      const pv = await api<Preview>(`/${id}/preview?mode=fresh`);
      const dp = pv?.deletion_preview;
      if (!dp) throw new Error("Server returned no deletion preview");
      freshToken.current = dp.token;
      if (dp.count === 0)
        startFresh.mutate(dp.token); // nothing to delete: no destructive confirmation needed
      else {
        setDeletion(dp);
        setDialogOpen(true);
      }
    } catch (e: any) {
      toast.error(`Deletion preview failed: ${e.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (!data)
    return (
      <Container>
        <Text>Loading…</Text>
      </Container>
    );
  const { job } = data;
  const pct = job.total_batches
    ? Math.round((job.completed_batches / job.total_batches) * 100)
    : 0;
  const busy = job.status === "processing" && !job.interrupted;
  const canContinue =
    job.interrupted || job.status === "failed" || job.status === "paused";

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Link to="/imports" className="text-ui-fg-subtle text-small">
              ← All imports
            </Link>
            <Heading>{job.filename ?? job.id}</Heading>
          </div>
          <div className="flex items-center gap-x-2">
            <StatusBadge color={statusColor(job)}>
              {statusLabel(job)}
            </StatusBadge>
            {job.stage === "uploaded" && (
              <Button
                isLoading={preprocess.isPending}
                onClick={() => preprocess.mutate()}
              >
                Preprocess
              </Button>
            )}
            {job.stage === "preprocessed" && !busy && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? "Hide preview" : "Preview"}
                </Button>
                <div className="flex items-center gap-x-2">
                  <Checkbox
                    id="fresh-mode"
                    checked={freshMode}
                    onCheckedChange={(v) => setFreshMode(v === true)}
                  />
                  <Label htmlFor="fresh-mode" size="small">
                    Fresh import (delete previously imported products first)
                  </Label>
                </div>
                <Button
                  variant={freshMode ? "danger" : "primary"}
                  isLoading={
                    startMerge.isPending ||
                    previewLoading ||
                    startFresh.isPending
                  }
                  disabled={previewLoading}
                  onClick={() =>
                    freshMode ? openFresh() : startMerge.mutate()
                  }
                >
                  {freshMode
                    ? "Review deletion & import"
                    : "Start import (create or update)"}
                </Button>
              </>
            )}
            {data.failed_batches > 0 && !busy && (
              <Button
                variant="secondary"
                isLoading={retry.isPending}
                onClick={() => retry.mutate()}
              >
                Retry failed batches
              </Button>
            )}
            {job.stage === "importing" &&
              (job.status === "processing" || job.status === "pending") &&
              !job.interrupted && (
                <Button
                  variant="danger"
                  isLoading={stop.isPending}
                  onClick={() => stop.mutate()}
                >
                  Stop import
                </Button>
              )}
            {canContinue && job.stage !== "uploaded" && (
              <Button isLoading={cont.isPending} onClick={() => cont.mutate()}>
                Continue job
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-4 md:grid-cols-5">
          <Stat label="Stage" value={job.stage} />
          <Stat label="Rows" value={job.total_rows} />
          <Stat
            label="Products"
            value={`${job.processed_products}/${job.total_products}`}
          />
          <Stat label="Variants" value={job.total_variants} />
          <Stat label="Errors" value={data.error_count} />
        </div>
        {job.total_batches > 0 && (
          <div className="px-6 py-4">
            <div className="bg-ui-bg-component h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-ui-bg-interactive h-2"
                style={{ width: `${pct}%` }}
              />
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              {job.completed_batches}/{job.total_batches} batches ({pct}%)
            </Text>
          </div>
        )}
        {job.interrupted && (
          <div className="px-6 py-3">
            <Text size="small">
              This job stopped reporting progress (server restart or crash).
              Click <b>Continue job</b> to resume from the last checkpoint;
              completed batches are not repeated.
            </Text>
          </div>
        )}
        {job.last_error && (
          <div className="px-6 py-3">
            <Text size="small" className="text-ui-fg-error">
              {job.last_error}
            </Text>
          </div>
        )}
      </Container>

      {showPreview && (
        <Container className="p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Preview (first products)</Heading>
            {preview.data && (
              <Text size="small" className="text-ui-fg-subtle">
                {preview.data.warning_count} warnings,{" "}
                {preview.data.error_count} row errors
              </Text>
            )}
          </div>
          <pre className="bg-ui-bg-subtle max-h-96 overflow-auto px-6 py-4 text-xs">
            {preview.data
              ? JSON.stringify(preview.data.sample, null, 2)
              : "Loading…"}
          </pre>
        </Container>
      )}

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Batches</Heading>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>#</Table.HeaderCell>
              <Table.HeaderCell>Products</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Attempts</Table.HeaderCell>
              <Table.HeaderCell>Error</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.batches.map((b) => (
              <Table.Row key={b.id}>
                <Table.Cell>{b.idx + 1}</Table.Cell>
                <Table.Cell>{b.size}</Table.Cell>
                <Table.Cell>
                  <StatusBadge
                    color={
                      (
                        {
                          completed: "green",
                          failed: "red",
                          processing: "blue",
                          pending: "grey",
                        } as any
                      )[b.status]
                    }
                  >
                    {b.status}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell>{b.attempts}</Table.Cell>
                <Table.Cell className="max-w-xs truncate">
                  {b.error ?? ""}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        {job.total_batches > data.batches.length && (
          <Text size="small" className="text-ui-fg-subtle px-6 py-3">
            Showing first {data.batches.length} of {job.total_batches} batches.
          </Text>
        )}
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">
            Errors & warnings (latest 50 of {data.error_count + 0})
          </Heading>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Severity</Table.HeaderCell>
              <Table.HeaderCell>Stage</Table.HeaderCell>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Row</Table.HeaderCell>
              <Table.HeaderCell>Message</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.errors.map((e) => (
              <Table.Row key={e.id}>
                <Table.Cell>
                  <StatusBadge
                    color={e.severity === "error" ? "red" : "orange"}
                  >
                    {e.severity}
                  </StatusBadge>
                </Table.Cell>
                <Table.Cell>{e.stage}</Table.Cell>
                <Table.Cell className="max-w-48 truncate">
                  {e.product_key ?? ""}
                </Table.Cell>
                <Table.Cell>{e.row_number ?? ""}</Table.Cell>
                <Table.Cell>{e.message}</Table.Cell>
              </Table.Row>
            ))}
            {!data.errors.length && (
              <Table.Row>
                <Table.Cell>None</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Container>

      <Prompt open={dialogOpen} onOpenChange={setDialogOpen}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Delete previously imported products?</Prompt.Title>
            <Prompt.Description>
              A fresh import first deletes the {deletion.count} product(s)
              created by this import source, and nothing else. Products:{" "}
              {deletion.sample.map((p) => p.title).join(", ") || "none"}
              {deletion.count > deletion.sample.length ? ", …" : ""}
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel
              onClick={() => {
                freshToken.current = null;
              }}
            >
              Cancel
            </Prompt.Cancel>
            <Prompt.Action
              onClick={() => {
                const t = freshToken.current;
                if (t) startFresh.mutate(t);
              }}
            >
              Delete and import
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </div>
  );
}
