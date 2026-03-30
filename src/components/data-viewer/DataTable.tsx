import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DataTableProps {
  data: Record<string, any>[];
}

export function DataTable({ data }: DataTableProps) {
  if (!data.length) return <p className="text-muted-foreground text-sm p-6">No data available.</p>;

  const columns = Object.keys(data[0]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-auto max-h-[calc(100vh-220px)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-[11px] font-semibold text-muted-foreground w-12">#</TableHead>
            {columns.map(col => (
              <TableHead key={col} className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} className="hover:bg-muted/30">
              <TableCell className="text-[11px] text-muted-foreground font-mono">{i + 1}</TableCell>
              {columns.map(col => (
                <TableCell key={col} className="text-[12px] text-foreground whitespace-nowrap max-w-[200px] truncate">
                  {row[col] == null ? <span className="text-muted-foreground/50 italic">null</span> : String(row[col])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
