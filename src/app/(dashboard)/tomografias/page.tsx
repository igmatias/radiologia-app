import { getBranches } from "@/actions/common"
import { getActiveTemplate } from "@/actions/report-templates"
import TomografiasClient from "./tomografias-client"

export default async function TomografiasPage() {
  const [branches, activeTemplate] = await Promise.all([
    getBranches(),
    getActiveTemplate(),
  ])
  return <TomografiasClient branches={branches} activeTemplate={activeTemplate} />
}
