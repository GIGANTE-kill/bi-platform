import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableHead } from "@/components/ui/table";
import { GripVertical } from "lucide-react";

interface SortableHeaderCellProps {
    id: string;
    label: string;
    alignmentClass: string;
}

export function SortableHeaderCell({
    id,
    label,
    alignmentClass
}: SortableHeaderCellProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : "static" as const,
    };

    return (
        <TableHead
            ref={setNodeRef}
            style={style}
            className={`text-xs font-bold uppercase tracking-wider text-foreground/70 bg-muted/40 py-2 px-2 border-r border-border/20 last:border-r-0 align-middle ${alignmentClass}`}
        >
            <div className="flex items-center gap-2 min-w-[120px]">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-1 rounded-md transition-colors w-full group">
                    <span className="truncate flex-1">{label}</span>
                    <div
                        className="cursor-grab active:cursor-grabbing hover:bg-muted/80 p-1 rounded transition-colors touch-none"
                        {...attributes}
                        {...listeners}
                        title="Arraste para mover a coluna"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>
        </TableHead>
    );
}
