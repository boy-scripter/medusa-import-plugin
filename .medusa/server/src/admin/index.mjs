import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ArrowUpTray } from "@medusajs/icons";
import { toast, Container, Heading, Text, Button, Table, StatusBadge, Checkbox, Label, Prompt } from "@medusajs/ui";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
const base = () => typeof __BACKEND_URL__ !== "undefined" && __BACKEND_URL__ ? __BACKEND_URL__ : "";
async function api(path, init = {}) {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${base()}/admin/imports${path}`, {
    credentials: "include",
    ...init,
    headers: isForm ? init.headers : { "Content-Type": "application/json", ...init.headers ?? {} }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.message ?? res.statusText), { status: res.status, body });
  return body;
}
const statusColor = (j) => j.interrupted ? "orange" : { completed: "green", completed_with_errors: "orange", failed: "red", processing: "blue", pending: "grey", paused: "orange" }[j.status] ?? "grey";
const statusLabel = (j) => j.interrupted ? "interrupted" : j.status.replace(/_/g, " ");
const ImportsPage = () => {
  const qc = useQueryClient();
  const nav = useNavigate();
  const input = useRef(null);
  const { data, isLoading } = useQuery({
    queryKey: ["imports"],
    queryFn: () => api(""),
    refetchInterval: (q) => q.state.data?.jobs.some((j) => j.status === "processing" && !j.interrupted) ? 3e3 : false
  });
  const upload = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return api("", { method: "POST", body: fd });
    },
    onSuccess: ({ job }) => {
      toast.success("CSV uploaded");
      qc.invalidateQueries({ queryKey: ["imports"] });
      nav(`/imports/${job.id}`);
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxs(Container, { className: "divide-y p-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Heading, { children: "Product import" }),
        /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: "Upload a CSV, preprocess it, then import in batches of 10 products." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: input,
            type: "file",
            accept: ".csv,text/csv",
            hidden: true,
            onChange: (e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }
          }
        ),
        /* @__PURE__ */ jsx(Button, { isLoading: upload.isPending, onClick: () => input.current?.click(), children: "Upload CSV" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(Table.Header, { children: /* @__PURE__ */ jsxs(Table.Row, { children: [
        /* @__PURE__ */ jsx(Table.HeaderCell, { children: "File" }),
        /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Stage" }),
        /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Status" }),
        /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Progress" }),
        /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Created" })
      ] }) }),
      /* @__PURE__ */ jsxs(Table.Body, { children: [
        isLoading && /* @__PURE__ */ jsx(Table.Row, { children: /* @__PURE__ */ jsx(Table.Cell, { children: "Loading…" }) }),
        data?.jobs.map((j) => /* @__PURE__ */ jsxs(Table.Row, { className: "cursor-pointer", children: [
          /* @__PURE__ */ jsx(Table.Cell, { children: /* @__PURE__ */ jsx(Link, { className: "text-ui-fg-interactive", to: `/imports/${j.id}`, children: j.filename ?? j.id }) }),
          /* @__PURE__ */ jsx(Table.Cell, { children: j.stage }),
          /* @__PURE__ */ jsx(Table.Cell, { children: /* @__PURE__ */ jsx(StatusBadge, { color: statusColor(j), children: statusLabel(j) }) }),
          /* @__PURE__ */ jsx(Table.Cell, { children: j.total_batches ? `${j.completed_batches}/${j.total_batches} batches` : "-" }),
          /* @__PURE__ */ jsx(Table.Cell, { children: new Date(j.created_at).toLocaleString() })
        ] }, j.id)),
        data && !data.jobs.length && /* @__PURE__ */ jsx(Table.Row, { children: /* @__PURE__ */ jsx(Table.Cell, { children: "No imports yet." }) })
      ] })
    ] })
  ] });
};
const config = defineRouteConfig({ label: "Product import", icon: ArrowUpTray });
const Stat = ({ label, value }) => /* @__PURE__ */ jsxs("div", { children: [
  /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-subtle", children: label }),
  /* @__PURE__ */ jsx(Text, { weight: "plus", children: value })
] });
function ImportDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [freshMode, setFreshMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletion, setDeletion] = useState({
    count: 0,
    sample: [],
    token: ""
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const freshToken = useRef(null);
  const { data } = useQuery({
    queryKey: ["import", id],
    queryFn: () => api(`/${id}`),
    refetchInterval: (q) => {
      const j = q.state.data?.job;
      return j && (j.status === "processing" || j.status === "pending") && j.stage !== "uploaded" && j.stage !== "preprocessed" ? 3e3 : false;
    }
  });
  const preview = useQuery({
    queryKey: ["import-preview", id],
    queryFn: () => api(`/${id}/preview`),
    enabled: showPreview
  });
  const act = (path, ok, body) => ({
    mutationFn: () => api(`/${id}/${path}`, {
      method: "POST",
      body: JSON.stringify(body ?? {})
    }),
    onSuccess: () => {
      toast.success(ok);
      qc.invalidateQueries({ queryKey: ["import", id] });
    },
    onError: (e) => toast.error(e.message)
  });
  const preprocess = useMutation(act("preprocess", "Preprocessing started"));
  const startMerge = useMutation(
    act("start", "Import started", { mode: "merge" })
  );
  const retry = useMutation(act("retry", "Failed batches re-queued"));
  const cont = useMutation(act("continue", "Job resumed from last checkpoint"));
  const freshBody = (token) => JSON.stringify({
    mode: "fresh",
    confirm_deletion: { token, confirm: true }
  });
  const startFresh = useMutation({
    mutationFn: (token) => api(`/${id}/start`, { method: "POST", body: freshBody(token) }),
    onSuccess: () => {
      toast.success("Fresh import started");
      freshToken.current = null;
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["import", id] });
    },
    onError: (e) => {
      if (e.status === 409 && e.body?.deletion_preview) {
        freshToken.current = e.body.deletion_preview.token;
        setDeletion(e.body.deletion_preview);
        setDialogOpen(true);
        toast.warning(
          "The set of products to delete changed. Please review again."
        );
      } else toast.error(e.message);
    }
  });
  const openFresh = async () => {
    setPreviewLoading(true);
    try {
      const pv = await api(`/${id}/preview?mode=fresh`);
      const dp = pv?.deletion_preview;
      if (!dp) throw new Error("Server returned no deletion preview");
      freshToken.current = dp.token;
      if (dp.count === 0)
        startFresh.mutate(dp.token);
      else {
        setDeletion(dp);
        setDialogOpen(true);
      }
    } catch (e) {
      toast.error(`Deletion preview failed: ${e.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };
  if (!data)
    return /* @__PURE__ */ jsx(Container, { children: /* @__PURE__ */ jsx(Text, { children: "Loading…" }) });
  const { job } = data;
  const pct = job.total_batches ? Math.round(job.completed_batches / job.total_batches * 100) : 0;
  const busy = job.status === "processing" && !job.interrupted;
  const canContinue = job.interrupted || job.status === "failed" || job.status === "paused";
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-y-3", children: [
    /* @__PURE__ */ jsxs(Container, { className: "divide-y p-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Link, { to: "/imports", className: "text-ui-fg-subtle text-small", children: "← All imports" }),
          /* @__PURE__ */ jsx(Heading, { children: job.filename ?? job.id })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-x-2", children: [
          /* @__PURE__ */ jsx(StatusBadge, { color: statusColor(job), children: statusLabel(job) }),
          job.stage === "uploaded" && /* @__PURE__ */ jsx(
            Button,
            {
              isLoading: preprocess.isPending,
              onClick: () => preprocess.mutate(),
              children: "Preprocess"
            }
          ),
          job.stage === "preprocessed" && !busy && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "secondary",
                onClick: () => setShowPreview((v) => !v),
                children: showPreview ? "Hide preview" : "Preview"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-x-2", children: [
              /* @__PURE__ */ jsx(
                Checkbox,
                {
                  id: "fresh-mode",
                  checked: freshMode,
                  onCheckedChange: (v) => setFreshMode(v === true)
                }
              ),
              /* @__PURE__ */ jsx(Label, { htmlFor: "fresh-mode", size: "small", children: "Fresh import (delete previously imported products first)" })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: freshMode ? "danger" : "primary",
                isLoading: startMerge.isPending || previewLoading || startFresh.isPending,
                disabled: previewLoading,
                onClick: () => freshMode ? openFresh() : startMerge.mutate(),
                children: freshMode ? "Review deletion & import" : "Start import (create or update)"
              }
            )
          ] }),
          data.failed_batches > 0 && !busy && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "secondary",
              isLoading: retry.isPending,
              onClick: () => retry.mutate(),
              children: "Retry failed batches"
            }
          ),
          canContinue && job.stage !== "uploaded" && /* @__PURE__ */ jsx(Button, { isLoading: cont.isPending, onClick: () => cont.mutate(), children: "Continue job" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 px-6 py-4 md:grid-cols-5", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Stage", value: job.stage }),
        /* @__PURE__ */ jsx(Stat, { label: "Rows", value: job.total_rows }),
        /* @__PURE__ */ jsx(
          Stat,
          {
            label: "Products",
            value: `${job.processed_products}/${job.total_products}`
          }
        ),
        /* @__PURE__ */ jsx(Stat, { label: "Variants", value: job.total_variants }),
        /* @__PURE__ */ jsx(Stat, { label: "Errors", value: data.error_count })
      ] }),
      job.total_batches > 0 && /* @__PURE__ */ jsxs("div", { className: "px-6 py-4", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-ui-bg-component h-2 w-full overflow-hidden rounded-full", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "bg-ui-bg-interactive h-2",
            style: { width: `${pct}%` }
          }
        ) }),
        /* @__PURE__ */ jsxs(Text, { size: "small", className: "text-ui-fg-subtle mt-1", children: [
          job.completed_batches,
          "/",
          job.total_batches,
          " batches (",
          pct,
          "%)"
        ] })
      ] }),
      job.interrupted && /* @__PURE__ */ jsx("div", { className: "px-6 py-3", children: /* @__PURE__ */ jsxs(Text, { size: "small", children: [
        "This job stopped reporting progress (server restart or crash). Click ",
        /* @__PURE__ */ jsx("b", { children: "Continue job" }),
        " to resume from the last checkpoint; completed batches are not repeated."
      ] }) }),
      job.last_error && /* @__PURE__ */ jsx("div", { className: "px-6 py-3", children: /* @__PURE__ */ jsx(Text, { size: "small", className: "text-ui-fg-error", children: job.last_error }) })
    ] }),
    showPreview && /* @__PURE__ */ jsxs(Container, { className: "p-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-4", children: [
        /* @__PURE__ */ jsx(Heading, { level: "h2", children: "Preview (first products)" }),
        preview.data && /* @__PURE__ */ jsxs(Text, { size: "small", className: "text-ui-fg-subtle", children: [
          preview.data.warning_count,
          " warnings,",
          " ",
          preview.data.error_count,
          " row errors"
        ] })
      ] }),
      /* @__PURE__ */ jsx("pre", { className: "bg-ui-bg-subtle max-h-96 overflow-auto px-6 py-4 text-xs", children: preview.data ? JSON.stringify(preview.data.sample, null, 2) : "Loading…" })
    ] }),
    /* @__PURE__ */ jsxs(Container, { className: "p-0", children: [
      /* @__PURE__ */ jsx("div", { className: "px-6 py-4", children: /* @__PURE__ */ jsx(Heading, { level: "h2", children: "Batches" }) }),
      /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(Table.Header, { children: /* @__PURE__ */ jsxs(Table.Row, { children: [
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "#" }),
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Products" }),
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Status" }),
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Attempts" }),
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Error" })
        ] }) }),
        /* @__PURE__ */ jsx(Table.Body, { children: data.batches.map((b) => /* @__PURE__ */ jsxs(Table.Row, { children: [
          /* @__PURE__ */ jsx(Table.Cell, { children: b.idx + 1 }),
          /* @__PURE__ */ jsx(Table.Cell, { children: b.size }),
          /* @__PURE__ */ jsx(Table.Cell, { children: /* @__PURE__ */ jsx(
            StatusBadge,
            {
              color: {
                completed: "green",
                failed: "red",
                processing: "blue",
                pending: "grey"
              }[b.status],
              children: b.status
            }
          ) }),
          /* @__PURE__ */ jsx(Table.Cell, { children: b.attempts }),
          /* @__PURE__ */ jsx(Table.Cell, { className: "max-w-xs truncate", children: b.error ?? "" })
        ] }, b.id)) })
      ] }),
      job.total_batches > data.batches.length && /* @__PURE__ */ jsxs(Text, { size: "small", className: "text-ui-fg-subtle px-6 py-3", children: [
        "Showing first ",
        data.batches.length,
        " of ",
        job.total_batches,
        " batches."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Container, { className: "p-0", children: [
      /* @__PURE__ */ jsx("div", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs(Heading, { level: "h2", children: [
        "Errors & warnings (latest 50 of ",
        data.error_count + 0,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(Table.Header, { children: /* @__PURE__ */ jsxs(Table.Row, { children: [
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Severity" }),
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Stage" }),
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Product" }),
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Row" }),
          /* @__PURE__ */ jsx(Table.HeaderCell, { children: "Message" })
        ] }) }),
        /* @__PURE__ */ jsxs(Table.Body, { children: [
          data.errors.map((e) => /* @__PURE__ */ jsxs(Table.Row, { children: [
            /* @__PURE__ */ jsx(Table.Cell, { children: /* @__PURE__ */ jsx(
              StatusBadge,
              {
                color: e.severity === "error" ? "red" : "orange",
                children: e.severity
              }
            ) }),
            /* @__PURE__ */ jsx(Table.Cell, { children: e.stage }),
            /* @__PURE__ */ jsx(Table.Cell, { className: "max-w-48 truncate", children: e.product_key ?? "" }),
            /* @__PURE__ */ jsx(Table.Cell, { children: e.row_number ?? "" }),
            /* @__PURE__ */ jsx(Table.Cell, { children: e.message })
          ] }, e.id)),
          !data.errors.length && /* @__PURE__ */ jsx(Table.Row, { children: /* @__PURE__ */ jsx(Table.Cell, { children: "None" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Prompt, { open: dialogOpen, onOpenChange: setDialogOpen, children: /* @__PURE__ */ jsxs(Prompt.Content, { children: [
      /* @__PURE__ */ jsxs(Prompt.Header, { children: [
        /* @__PURE__ */ jsx(Prompt.Title, { children: "Delete previously imported products?" }),
        /* @__PURE__ */ jsxs(Prompt.Description, { children: [
          "A fresh import first deletes the ",
          deletion.count,
          " product(s) created by this import source, and nothing else. Products:",
          " ",
          deletion.sample.map((p) => p.title).join(", ") || "none",
          deletion.count > deletion.sample.length ? ", …" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Prompt.Footer, { children: [
        /* @__PURE__ */ jsx(
          Prompt.Cancel,
          {
            onClick: () => {
              freshToken.current = null;
            },
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Prompt.Action,
          {
            onClick: () => {
              const t = freshToken.current;
              if (t) startFresh.mutate(t);
            },
            children: "Delete and import"
          }
        )
      ] })
    ] }) })
  ] });
}
const widgetModule = { widgets: [] };
const routeModule = {
  routes: [
    {
      Component: ImportsPage,
      path: "/imports",
      handle: { label: config.label, translationNs: config.translationNs }
    },
    {
      Component: ImportDetail,
      path: "/imports/:id"
    }
  ]
};
const menuItemModule = {
  menuItems: [
    {
      label: config.label,
      icon: config.icon,
      path: "/imports",
      nested: void 0,
      rank: void 0,
      translationNs: void 0
    }
  ]
};
const formModule = { customFields: {} };
const displayModule = {
  displays: {}
};
const i18nModule = { resources: {} };
const cellRendererModule = {};
const layoutModule = { layouts: [] };
const searchEntityModule = {};
const plugin = {
  widgetModule,
  routeModule,
  menuItemModule,
  formModule,
  displayModule,
  i18nModule,
  cellRendererModule,
  layoutModule,
  searchEntityModule
};
export {
  plugin as default
};
