import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { MarkdownContent } from "@/components/markdown/MarkdownContent.jsx";
import { Button } from "@/components/ui/button";
import termsMarkdown from "../../../docs/legal/DIEU-KHOAN-SU-DUNG.md?raw";
import privacyMarkdown from "../../../docs/legal/CHINH-SACH-BAO-MAT.md?raw";

const CONTENT = {
  terms: termsMarkdown,
  privacy: privacyMarkdown,
};

/**
 * @param {{ kind: 'terms' | 'privacy' }} props
 */
export default function LegalDocumentPage({ kind }) {
  const { t } = useTranslation();
  const content = CONTENT[kind];
  const title = t(`legal.${kind}.pageTitle`);
  const updated = t(`legal.${kind}.updated`);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/landing">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("legal.back")}
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs text-muted-foreground mb-2">{updated}</p>
        <h1 className="text-2xl font-bold tracking-tight mb-6">{title}</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none legal-doc">
          <MarkdownContent content={content} />
        </div>
        <p className="mt-10 text-sm text-muted-foreground border-t pt-6">
          {t("legal.draftNotice")}
        </p>
      </main>
    </div>
  );
}
