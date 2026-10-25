"use strict";
const jsxRuntime = require("react/jsx-runtime");
const adminSdk = require("@medusajs/admin-sdk");
const icons = require("@medusajs/icons");
const ui = require("@medusajs/ui");
const reactQuery = require("@tanstack/react-query");
const react = require("react");
const reactRouterDom = require("react-router-dom");
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
  const qc = reactQuery.useQueryClient();
  const nav = reactRouterDom.useNavigate();
  const input = react.useRef(null);
  const { data, isLoading } = reactQuery.useQuery({
    queryKey: ["imports"],
    queryFn: () => api(""),
    refetchInterval: (q) => q.state.data?.jobs.some((j) => j.status === "processing" && !j.interrupted) ? 3e3 : false
  });
  const upload = reactQuery.useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return api("", { method: "POST", body: fd });
    },
    onSuccess: ({ job }) => {
      ui.toast.success("CSV uploaded");
      qc.invalidateQueries({ queryKey: ["imports"] });
      nav(`/imports/${job.id}`);
    },
    onError: (e) => ui.toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntime.jsxs(ui.Container, { className: "divide-y p-0", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Heading, { children: "Product import" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", className: "text-ui-fg-subtle", children: "Upload a CSV, preprocess it, then import in batches of 10 products." })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntime.jsx(
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
        /* @__PURE__ */ jsxRuntime.jsx(ui.Button, { isLoading: upload.isPending, onClick: () => input.current?.click(), children: "Upload CSV" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(ui.Table, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Header, { children: /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Row, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "File" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Stage" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Status" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Progress" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Created" })
      ] }) }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Body, { children: [
        isLoading && /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Row, { children: /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: "Loading…" }) }),
        data?.jobs.map((j) => /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Row, { className: "cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Link, { className: "text-ui-fg-interactive", to: `/imports/${j.id}`, children: j.filename ?? j.id }) }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: j.stage }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsx(ui.StatusBadge, { color: statusColor(j), children: statusLabel(j) }) }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: j.total_batches ? `${j.completed_batches}/${j.total_batches} batches` : "-" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: new Date(j.created_at).toLocaleString() })
        ] }, j.id)),
        data && !data.jobs.length && /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Row, { children: /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: "No imports yet." }) })
      ] })
    ] })
  ] });
};
const config = adminSdk.defineRouteConfig({ label: "Product import", icon: icons.ArrowUpTray });
const Stat = ({ label, value }) => /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", className: "text-ui-fg-subtle", children: label }),
  /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { weight: "plus", children: value })
] });
function ImportDetail() {
  const { id } = reactRouterDom.useParams();
  const qc = reactQuery.useQueryClient();
  const [showPreview, setShowPreview] = react.useState(false);
  const [freshMode, setFreshMode] = react.useState(false);
  const [fresh, setFresh] = react.useState(null);
  const freshToken = react.useRef(null);
  const { data } = reactQuery.useQuery({
    queryKey: ["import", id],
    queryFn: () => api(`/${id}`),
    refetchInterval: (q) => {
      const j = q.state.data?.job;
      return j && (j.status === "processing" || j.status === "pending") && j.stage !== "uploaded" && j.stage !== "preprocessed" ? 3e3 : false;
    }
  });
  const preview = reactQuery.useQuery({
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
      ui.toast.success(ok);
      qc.invalidateQueries({ queryKey: ["import", id] });
    },
    onError: (e) => ui.toast.error(e.message)
  });
  const preprocess = reactQuery.useMutation(act("preprocess", "Preprocessing started"));
  const startMerge = reactQuery.useMutation(
    act("start", "Import started", { mode: "merge" })
  );
  const retry = reactQuery.useMutation(act("retry", "Failed batches re-queued"));
  const cont = reactQuery.useMutation(act("continue", "Job resumed from last checkpoint"));
  const freshBody = (token) => JSON.stringify({
    mode: "fresh",
    confirm_deletion: { token, confirm: true }
  });
  const startFresh = reactQuery.useMutation({
    mutationFn: (token) => api(`/${id}/start`, { method: "POST", body: freshBody(token) }),
    onSuccess: () => {
      ui.toast.success("Fresh import started");
      freshToken.current = null;
      setFresh(null);
      qc.invalidateQueries({ queryKey: ["import", id] });
    },
    onError: (e) => {
      if (e.status === 409 && e.body?.deletion_preview) {
        freshToken.current = e.body.deletion_preview.token;
        setFresh({
          sample: [],
          warning_count: 0,
          error_count: 0,
          deletion_preview: e.body.deletion_preview
        });
        ui.toast.warning(
          "The set of products to delete changed. Please review again."
        );
      } else ui.toast.error(e.message);
    }
  });
  const openFresh = async () => {
    try {
      const pv = await api(`/${id}/preview?mode=fresh`);
      const dp = pv.deletion_preview;
      if (!dp) throw new Error("Server returned no deletion preview");
      if (dp.count === 0)
        startFresh.mutate(dp.token);
      else {
        freshToken.current = dp.token;
        setFresh(pv);
      }
    } catch (e) {
      ui.toast.error(`Deletion preview failed: ${e.message}`);
    }
  };
  if (!data)
    return /* @__PURE__ */ jsxRuntime.jsx(ui.Container, { children: /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { children: "Loading…" }) });
  const { job } = data;
  const pct = job.total_batches ? Math.round(job.completed_batches / job.total_batches * 100) : 0;
  const busy = job.status === "processing" && !job.interrupted;
  const canContinue = job.interrupted || job.status === "failed" || job.status === "paused";
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-col gap-y-3", children: [
    /* @__PURE__ */ jsxRuntime.jsxs(ui.Container, { className: "divide-y p-0", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Link, { to: "/imports", className: "text-ui-fg-subtle text-small", children: "← All imports" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Heading, { children: job.filename ?? job.id })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-x-2", children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.StatusBadge, { color: statusColor(job), children: statusLabel(job) }),
          job.stage === "uploaded" && /* @__PURE__ */ jsxRuntime.jsx(
            ui.Button,
            {
              isLoading: preprocess.isPending,
              onClick: () => preprocess.mutate(),
              children: "Preprocess"
            }
          ),
          job.stage === "preprocessed" && !busy && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              ui.Button,
              {
                variant: "secondary",
                onClick: () => setShowPreview((v) => !v),
                children: showPreview ? "Hide preview" : "Preview"
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-x-2", children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                ui.Checkbox,
                {
                  id: "fresh-mode",
                  checked: freshMode,
                  onCheckedChange: (v) => setFreshMode(v === true)
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(ui.Label, { htmlFor: "fresh-mode", size: "small", children: "Fresh import (delete previously imported products first)" })
            ] }),
            /* @__PURE__ */ jsxRuntime.jsx(
              ui.Button,
              {
                variant: freshMode ? "danger" : "primary",
                isLoading: startMerge.isPending,
                onClick: () => freshMode ? openFresh() : startMerge.mutate(),
                children: freshMode ? "Review deletion & import" : "Start import (create or update)"
              }
            )
          ] }),
          data.failed_batches > 0 && !busy && /* @__PURE__ */ jsxRuntime.jsx(
            ui.Button,
            {
              variant: "secondary",
              isLoading: retry.isPending,
              onClick: () => retry.mutate(),
              children: "Retry failed batches"
            }
          ),
          canContinue && job.stage !== "uploaded" && /* @__PURE__ */ jsxRuntime.jsx(ui.Button, { isLoading: cont.isPending, onClick: () => cont.mutate(), children: "Continue job" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "grid grid-cols-2 gap-4 px-6 py-4 md:grid-cols-5", children: [
        /* @__PURE__ */ jsxRuntime.jsx(Stat, { label: "Stage", value: job.stage }),
        /* @__PURE__ */ jsxRuntime.jsx(Stat, { label: "Rows", value: job.total_rows }),
        /* @__PURE__ */ jsxRuntime.jsx(
          Stat,
          {
            label: "Products",
            value: `${job.processed_products}/${job.total_products}`
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(Stat, { label: "Variants", value: job.total_variants }),
        /* @__PURE__ */ jsxRuntime.jsx(Stat, { label: "Errors", value: data.error_count })
      ] }),
      job.total_batches > 0 && /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "px-6 py-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { className: "bg-ui-bg-component h-2 w-full overflow-hidden rounded-full", children: /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            className: "bg-ui-bg-interactive h-2",
            style: { width: `${pct}%` }
          }
        ) }),
        /* @__PURE__ */ jsxRuntime.jsxs(ui.Text, { size: "small", className: "text-ui-fg-subtle mt-1", children: [
          job.completed_batches,
          "/",
          job.total_batches,
          " batches (",
          pct,
          "%)"
        ] })
      ] }),
      job.interrupted && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "px-6 py-3", children: /* @__PURE__ */ jsxRuntime.jsxs(ui.Text, { size: "small", children: [
        "This job stopped reporting progress (server restart or crash). Click ",
        /* @__PURE__ */ jsxRuntime.jsx("b", { children: "Continue job" }),
        " to resume from the last checkpoint; completed batches are not repeated."
      ] }) }),
      job.last_error && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "px-6 py-3", children: /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: "small", className: "text-ui-fg-error", children: job.last_error }) })
    ] }),
    showPreview && /* @__PURE__ */ jsxRuntime.jsxs(ui.Container, { className: "p-0", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "px-6 py-4", children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Heading, { level: "h2", children: "Preview (first products)" }),
        preview.data && /* @__PURE__ */ jsxRuntime.jsxs(ui.Text, { size: "small", className: "text-ui-fg-subtle", children: [
          preview.data.warning_count,
          " warnings,",
          " ",
          preview.data.error_count,
          " row errors"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("pre", { className: "bg-ui-bg-subtle max-h-96 overflow-auto px-6 py-4 text-xs", children: preview.data ? JSON.stringify(preview.data.sample, null, 2) : "Loading…" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(ui.Container, { className: "p-0", children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntime.jsx(ui.Heading, { level: "h2", children: "Batches" }) }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Table, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Header, { children: /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Row, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "#" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Products" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Status" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Attempts" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Error" })
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Body, { children: data.batches.map((b) => /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Row, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: b.idx + 1 }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: b.size }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsx(
            ui.StatusBadge,
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
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: b.attempts }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { className: "max-w-xs truncate", children: b.error ?? "" })
        ] }, b.id)) })
      ] }),
      job.total_batches > data.batches.length && /* @__PURE__ */ jsxRuntime.jsxs(ui.Text, { size: "small", className: "text-ui-fg-subtle px-6 py-3", children: [
        "Showing first ",
        data.batches.length,
        " of ",
        job.total_batches,
        " batches."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(ui.Container, { className: "p-0", children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntime.jsxs(ui.Heading, { level: "h2", children: [
        "Errors & warnings (latest 50 of ",
        data.error_count + 0,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Table, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Header, { children: /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Row, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Severity" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Stage" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Product" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Row" }),
          /* @__PURE__ */ jsxRuntime.jsx(ui.Table.HeaderCell, { children: "Message" })
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Body, { children: [
          data.errors.map((e) => /* @__PURE__ */ jsxRuntime.jsxs(ui.Table.Row, { children: [
            /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: /* @__PURE__ */ jsxRuntime.jsx(
              ui.StatusBadge,
              {
                color: e.severity === "error" ? "red" : "orange",
                children: e.severity
              }
            ) }),
            /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: e.stage }),
            /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { className: "max-w-48 truncate", children: e.product_key ?? "" }),
            /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: e.row_number ?? "" }),
            /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: e.message })
          ] }, e.id)),
          !data.errors.length && /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Row, { children: /* @__PURE__ */ jsxRuntime.jsx(ui.Table.Cell, { children: "None" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(ui.Prompt, { open: !!fresh, onOpenChange: (o) => !o && setFresh(null), children: /* @__PURE__ */ jsxRuntime.jsxs(ui.Prompt.Content, { children: [
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Prompt.Header, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Prompt.Title, { children: "Delete previously imported products?" }),
        /* @__PURE__ */ jsxRuntime.jsxs(ui.Prompt.Description, { children: [
          "A fresh import first deletes the",
          " ",
          fresh?.deletion_preview?.count ?? 0,
          " product(s) created by this import source, and nothing else. Products:",
          " ",
          fresh?.deletion_preview?.sample.map((p) => p.title).join(", ") || "none",
          (fresh?.deletion_preview?.count ?? 0) > 25 ? ", …" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Prompt.Footer, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Prompt.Cancel,
          {
            onClick: () => {
              freshToken.current = null;
            },
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Prompt.Action,
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
module.exports = plugin;
