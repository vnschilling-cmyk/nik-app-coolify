import Link from "next/link";

interface RichTextDisplayProps {
    content: string;
    className?: string;
}

export default function RichTextDisplay({ content, className = "" }: RichTextDisplayProps) {
    if (!content) return null;

    // Detect if content is a pre-formatted HTML block (from AI or manual HTML)
    const isHtmlBlock = /^\s*<(div|p|section|article|header|footer|table|ul|ol|blockquote)(\s|>)/i.test(content);

    if (isHtmlBlock) {
        return (
            <div
                className={`prose prose-sm prose-zinc dark:prose-invert max-w-none ${className}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    // Helper to process text
    const processText = (text: string) => {
        return text
            // HTML Escape (basic)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            // Restore intended HTML tags (only <u> for now, maybe <br> later if needed)
            .replace(/&lt;u&gt;/g, "<u>").replace(/&lt;\/u&gt;/g, "</u>")
            // Bold
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            // Italic
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            // Alignment tags
            .replace(/\[left\](.*?)\[\/left\]/g, '<span style="display: block; text-align: left">$1</span>')
            .replace(/\[center\](.*?)\[\/center\]/g, '<span style="display: block; text-align: center">$1</span>')
            .replace(/\[right\](.*?)\[\/right\]/g, '<span style="display: block; text-align: right">$1</span>')
            .replace(/\[justify\](.*?)\[\/justify\]/g, '<span style="display: block; text-align: justify">$1</span>')
            // Links (basic)
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    };

    // Split by newlines to handle paragraphs and lists
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let currentList: JSX.Element[] = [];
    let listType: 'ul' | 'ol' | null = null;

    lines.forEach((line, index) => {
        const trimLine = line.trim();

        // Unordered List
        if (trimLine.startsWith('- ')) {
            if (listType !== 'ul' && currentList.length > 0) {
                // Flush previous list (must be ol since we're switching to ul)
                elements.push(
                    <ol key={`list-${index}`} className="list-decimal list-inside mb-4 space-y-1">{[...currentList]}</ol>
                );
                currentList = [];
            }
            listType = 'ul';
            currentList.push(
                <li key={`item-${index}`} dangerouslySetInnerHTML={{ __html: processText(trimLine.substring(2)) }} />
            );
            return; // Continue to next line
        }

        // Ordered List
        if (/^\d+\.\s/.test(trimLine)) {
            if (listType !== 'ol' && currentList.length > 0) {
                // Flush previous list (must be ul since we're switching to ol)
                elements.push(
                    <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{[...currentList]}</ul>
                );
                currentList = [];
            }
            listType = 'ol';
            const content = trimLine.replace(/^\d+\.\s/, '');
            currentList.push(
                <li key={`item-${index}`} dangerouslySetInnerHTML={{ __html: processText(content) }} />
            );
            return;
        }

        // Not a list item: Flush any pending list
        if (currentList.length > 0) {
            elements.push(
                listType === 'ul'
                    ? <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">{[...currentList]}</ul>
                    : <ol key={`list-${index}`} className="list-decimal list-inside mb-4 space-y-1">{[...currentList]}</ol>
            );
            currentList = [];
            listType = null;
        }

        // Empty line -> simple spacer or ignore
        if (!trimLine) {
            // elements.push(<div key={`spacer-${index}`} className="h-2" />);
            return;
        }

        // Standard Paragraph
        elements.push(
            <p key={`p-${index}`} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: processText(line) }} />
        );
    });

    // Flush any remaining list at the end
    if (currentList.length > 0) {
        elements.push(
            listType === 'ul'
                ? <ul key={`list-end`} className="list-disc list-inside mb-4 space-y-1">{[...currentList]}</ul>
                : <ol key={`list-end`} className="list-decimal list-inside mb-4 space-y-1">{[...currentList]}</ol>
        );
    }

    return (
        <div className={`prose prose-sm prose-zinc dark:prose-invert max-w-none ${className}`}>
            {elements}
        </div>
    );
}
