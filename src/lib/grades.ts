/**
 * German school grading scale:
 * 1 (Sehr gut): >= 95%
 * 2 (Gut): >= 80%
 * 3 (Befriedigend): >= 65%
 * 4 (Ausreichend): >= 50%
 * 5 (Mangelhaft): >= 25%
 * 6 (Ungenügend): < 25%
 */

export interface GradeInfo {
    grade: number;
    label: string;
    color: string;
}

export function calculateGrade(percentage: number): GradeInfo {
    if (percentage >= 95) return { grade: 1, label: "Sehr gut", color: "text-emerald-500" };
    if (percentage >= 80) return { grade: 2, label: "Gut", color: "text-emerald-400" };
    if (percentage >= 65) return { grade: 3, label: "Befriedigend", color: "text-yellow-400" };
    if (percentage >= 50) return { grade: 4, label: "Ausreichend", color: "text-amber-500" };
    if (percentage >= 25) return { grade: 5, label: "Mangelhaft", color: "text-orange-500" };
    return { grade: 6, label: "Ungenügend", color: "text-red-500" };
}

export function getGradeColor(grade: number): string {
    switch (grade) {
        case 1: return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case 2: return "bg-green-500/10 text-green-500 border-green-500/20";
        case 3: return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20";
        case 4: return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        case 5: return "bg-orange-500/10 text-orange-500 border-orange-500/20";
        case 6: return "bg-red-500/10 text-red-500 border-red-500/20";
        default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
}
