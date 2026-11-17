import { getLeads } from "../../services/leadService";
export const loadReportLeads = async () => {
  const all=[]; let page=1; let totalPages=1;
  do { const response=await getLeads({page,limit:200}); all.push(...(response.data||[])); totalPages=Number(response.totalPages||response.pagination?.totalPages||Math.ceil(Number(response.total||0)/200)||1); page++; } while(page<=totalPages);
  return {data:all};
};
