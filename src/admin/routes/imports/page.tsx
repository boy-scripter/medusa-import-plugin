import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowUpTray } from "@medusajs/icons"
import { Button, Container, Heading, StatusBadge, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api, statusColor, statusLabel, type Job } from "../../lib/api"

const ImportsPage = () => {
  const qc = useQueryClient()
  const nav = useNavigate()
  const input = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["imports"],
    queryFn: () => api<{ jobs: Job[] }>(""),
    refetchInterval: (q) => (q.state.data?.jobs.some((j) => j.status === "processing" && !j.interrupted) ? 3000 : false),
  })

  const upload = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append("file", file)
      return api<{ job: Job }>("", { method: "POST", body: fd })
    },
    onSuccess: ({ job }) => {
      toast.success("CSV uploaded")
      qc.invalidateQueries({ queryKey: ["imports"] })
      nav(`/imports/${job.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Product import</Heading>
          <Text size="small" className="text-ui-fg-subtle">Upload a CSV, preprocess it, then import in batches of 10 products.</Text>
        </div>
        <div>
          <input ref={input} type="file" accept=".csv,text/csv" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = "" }} />
          <Button isLoading={upload.isPending} onClick={() => input.current?.click()}>Upload CSV</Button>
        </div>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>File</Table.HeaderCell><Table.HeaderCell>Stage</Table.HeaderCell><Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Progress</Table.HeaderCell><Table.HeaderCell>Created</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && <Table.Row><Table.Cell>Loading…</Table.Cell></Table.Row>}
          {data?.jobs.map((j) => (
            <Table.Row key={j.id} className="cursor-pointer">
              <Table.Cell><Link className="text-ui-fg-interactive" to={`/imports/${j.id}`}>{j.filename ?? j.id}</Link></Table.Cell>
              <Table.Cell>{j.stage}</Table.Cell>
              <Table.Cell><StatusBadge color={statusColor(j)}>{statusLabel(j)}</StatusBadge></Table.Cell>
              <Table.Cell>{j.total_batches ? `${j.completed_batches}/${j.total_batches} batches` : "-"}</Table.Cell>
              <Table.Cell>{new Date(j.created_at).toLocaleString()}</Table.Cell>
            </Table.Row>
          ))}
          {data && !data.jobs.length && <Table.Row><Table.Cell>No imports yet.</Table.Cell></Table.Row>}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Product import", icon: ArrowUpTray })
export default ImportsPage
