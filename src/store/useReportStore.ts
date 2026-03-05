import { create } from "zustand";

interface ReportState {
    dataset: string;
    selectedColumns: string[];
    setDataset: (dataset: string, defaultColumns: string[]) => void;
    toggleColumn: (column: string) => void;
    reorderColumns: (oldIndex: number, newIndex: number) => void;
    reset: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
    dataset: "vendas",
    selectedColumns: [
        "dtcarga", "codprod", "codfilialpai", "descricao", "comprador",
        "codfornec", "fornecedor", "qt", "estoque", "codsupervisor",
        "codusur", "codcli", "faturamentoliquido", "devolucao", "custoliquido"
    ],
    setDataset: (dataset, defaultColumns) =>
        set({ dataset, selectedColumns: defaultColumns }),
    toggleColumn: (column) =>
        set((state) => ({
            selectedColumns: state.selectedColumns.includes(column)
                ? state.selectedColumns.filter((c) => c !== column)
                : [...state.selectedColumns, column],
        })),
    reorderColumns: (oldIndex, newIndex) =>
        set((state) => {
            const newCols = [...state.selectedColumns];
            const [movedCol] = newCols.splice(oldIndex, 1);
            newCols.splice(newIndex, 0, movedCol);
            return { selectedColumns: newCols };
        }),
    reset: () => set({
        dataset: "vendas", selectedColumns: [
            "dtcarga", "codprod", "codfilialpai", "descricao", "comprador",
            "codfornec", "fornecedor", "qt", "estoque", "codsupervisor",
            "codusur", "codcli", "faturamentoliquido", "devolucao", "custoliquido"
        ]
    }),
}));
