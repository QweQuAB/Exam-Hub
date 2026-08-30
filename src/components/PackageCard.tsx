import React from 'react';
import { 
  Download, 
  Heart, 
  Layers, 
  Calendar, 
  User, 
  Trash2, 
  CheckCircle2,
  FileQuestion,
  GraduationCap,
  Tag,
  Building2,
  Flag
} from 'lucide-react';
import { ForumPackageDocument } from '../types';
import { downloadPackageAsJsonFile } from '../lib/validation';
import { getCategoryIcon } from '../lib/categoryIcons';

interface PackageCardProps {
  pkg: ForumPackageDocument;
  onSelect: (pkg: ForumPackageDocument) => void;
  onToggleLike: (pkg: ForumPackageDocument, e: React.MouseEvent) => void;
  onTrackDownload: (pkg: ForumPackageDocument, e: React.MouseEvent) => void;
  onReport: (pkg: ForumPackageDocument, e: React.MouseEvent) => void;
  isLiked: boolean;
  isAdmin: boolean;
  onDelete: (packageId: string, title: string, e: React.MouseEvent) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  onSelect,
  onToggleLike,
  onTrackDownload,
  onReport,
  isLiked,
  isAdmin,
  onDelete,
}) => {
  const mcqCount = pkg.mcqQuestions?.length || 0;
  const essayCount = pkg.essayQuestions?.length || 0;
  const totalQuestions = mcqCount + essayCount;
  const CategoryIcon = getCategoryIcon(pkg.category);

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadPackageAsJsonFile(pkg);
    onTrackDownload(pkg, e);
  };

  const formattedDate = React.useMemo(() => {
    const timestamp = pkg.postedAt || pkg.exportedAt;
    if (!timestamp) return 'Recent';
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [pkg.postedAt, pkg.exportedAt]);

  return (
    <div
      onClick={() => onSelect(pkg)}
      className="group relative bg-surface hover:bg-elevated border border-line hover:border-accent/50 rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-accent/20 cursor-pointer flex flex-col justify-between"
    >
      {/* Top row: Category & Course Code & Admin Delete */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {pkg.courseCode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-accent/40 text-accent border border-accent/60 whitespace-nowrap">
                <GraduationCap className="w-3 h-3 text-accent shrink-0" />
                <span>{pkg.courseCode}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted/80 text-fg-secondary border border-line-strong/60 whitespace-nowrap">
              <CategoryIcon className="w-3 h-3 text-fg-muted shrink-0" />
              <span>{pkg.category || 'General'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReport(pkg, e);
              }}
              className="p-1.5 text-fg-dim hover:text-accent-rose bg-accent-rose/20 rounded-md transition opacity-70 group-hover:opacity-100"
              title="Report inappropriate content or broken links"
              aria-label="Report Package"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            {isAdmin && (
              <button
                onClick={(e) => onDelete(pkg.id, pkg.title, e)}
                className="p-1.5 text-rose-400 hover:text-rose-200 bg-accent-rose/30 rounded-md transition shrink-0"
                title="Moderator Delete"
                aria-label="Delete Package"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Package Title */}
        <h3 className="text-base sm:text-lg font-bold text-fg group-hover:text-cyan-600 text-accent transition-colors line-clamp-2 leading-snug mb-2">
          {pkg.title}
        </h3>

        {/* Institution if present */}
        {pkg.institution && (
          <p className="text-xs text-fg-muted flex items-center gap-1.5 mb-2.5">
            <Building2 className="w-3.5 h-3.5 text-fg-dim shrink-0" />
            <span className="truncate whitespace-nowrap">{pkg.institution}</span>
          </p>
        )}

        {/* Description snippet */}
        {pkg.description && (
          <p className="text-xs text-fg-muted/90 line-clamp-2 mb-3.5 leading-relaxed">
            {pkg.description}
          </p>
        )}

        {/* Question Breakdown Chips */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-page/90 border border-line text-fg whitespace-nowrap">
            <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="whitespace-nowrap">{totalQuestions} Qs</span>
          </span>

          {mcqCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-accent-blue/20 border border-accent-blue/50 text-accent-blue whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="whitespace-nowrap">{mcqCount} MCQ</span>
            </span>
          )}

          {essayCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-accent-indigo/20 border border-accent-indigo/50 text-accent-indigo whitespace-nowrap">
              <FileQuestion className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="whitespace-nowrap">{essayCount} Essay</span>
            </span>
          )}
        </div>

        {/* Tags */}
        {pkg.tags && pkg.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {pkg.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-fg-muted bg-muted/50 px-2 py-0.5 rounded border border-line-strong/40 whitespace-nowrap"
              >
                <Tag className="w-2.5 h-2.5 text-fg-dim shrink-0" />
                <span>{tag}</span>
              </span>
            ))}
            {pkg.tags.length > 3 && (
              <span className="text-[11px] text-fg-dim font-mono whitespace-nowrap">
                +{pkg.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Area: Author / Date + Likes / Downloads */}
      <div className="pt-3.5 border-t border-line/80 flex items-center justify-between text-xs text-fg-muted gap-2">
        
        {/* Author info */}
        <div className="flex flex-col truncate min-w-0 max-w-[55%]">
          <span className="text-fg-secondary font-medium truncate flex items-center gap-1 whitespace-nowrap">
            <User className="w-3 h-3 text-fg-muted shrink-0" />
            <span className="truncate">{pkg.author}</span>
          </span>
          <span className="text-[11px] text-fg-dim truncate flex items-center gap-1 whitespace-nowrap">
            <Calendar className="w-2.5 h-2.5 text-fg-dim shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </span>
        </div>

        {/* Action Counters (Like & Download) */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Like button */}
          <button
            onClick={(e) => onToggleLike(pkg, e)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              isLiked
                ? 'bg-accent-rose/40 text-accent-rose border border-accent-rose/80'
                : 'bg-muted/60 text-fg-secondary hover:text-accent-rose hover:bg-muted border border-line-strong/60'
            }`}
            title={isLiked ? 'Unlike package' : 'Like package'}
          >
            <Heart
              className={`w-3.5 h-3.5 shrink-0 ${
                isLiked ? 'fill-rose-400 text-rose-400' : 'text-fg-muted'
              }`}
            />
            <span className="whitespace-nowrap">{pkg.likeCount ?? 0}</span>
          </button>

          {/* Quick Download */}
          <button
            onClick={handleDownloadClick}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/30 hover:bg-cyan-900/80 text-accent border border-accent/60 hover:border-cyan-600 transition whitespace-nowrap"
            title="Download .json package for Android app"
          >
            <Download className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="whitespace-nowrap">{pkg.downloadCount ?? 0}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
