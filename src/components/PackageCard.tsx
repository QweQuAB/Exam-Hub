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
      className="group relative bg-white dark:bg-[#0e1628] hover:bg-slate-50 dark:bg-[#121c33] border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-cyan-950/20 cursor-pointer flex flex-col justify-between"
    >
      {/* Top row: Category & Course Code & Admin Delete */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {pkg.courseCode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 whitespace-nowrap">
                <GraduationCap className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span>{pkg.courseCode}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 whitespace-nowrap">
              <CategoryIcon className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>{pkg.category || 'General'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReport(pkg, e);
              }}
              className="p-1.5 text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:bg-rose-950/40 rounded-md transition opacity-70 group-hover:opacity-100"
              title="Report inappropriate content or broken links"
              aria-label="Report Package"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            {isAdmin && (
              <button
                onClick={(e) => onDelete(pkg.id, pkg.title, e)}
                className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-50 dark:bg-rose-950/60 rounded-md transition shrink-0"
                title="Moderator Delete"
                aria-label="Delete Package"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Package Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:text-cyan-300 transition-colors line-clamp-2 leading-snug mb-2">
          {pkg.title}
        </h3>

        {/* Institution if present */}
        {pkg.institution && (
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate whitespace-nowrap">{pkg.institution}</span>
          </p>
        )}

        {/* Description snippet */}
        {pkg.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400/90 line-clamp-2 mb-3.5 leading-relaxed">
            {pkg.description}
          </p>
        )}

        {/* Question Breakdown Chips */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap">
            <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">{totalQuestions} Qs</span>
          </span>

          {mcqCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-900/50 text-blue-600 dark:text-blue-300 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="whitespace-nowrap">{mcqCount} MCQ</span>
            </span>
          )}

          {essayCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-300 whitespace-nowrap">
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
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700/40 whitespace-nowrap"
              >
                <Tag className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                <span>{tag}</span>
              </span>
            ))}
            {pkg.tags.length > 3 && (
              <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                +{pkg.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Area: Author / Date + Likes / Downloads */}
      <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        
        {/* Author info */}
        <div className="flex flex-col truncate min-w-0 max-w-[55%]">
          <span className="text-slate-600 dark:text-slate-300 font-medium truncate flex items-center gap-1 whitespace-nowrap">
            <User className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="truncate">{pkg.author}</span>
          </span>
          <span className="text-[11px] text-slate-500 truncate flex items-center gap-1 whitespace-nowrap">
            <Calendar className="w-2.5 h-2.5 text-slate-500 shrink-0" />
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
                ? 'bg-rose-50 dark:bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 border border-rose-800/80'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60'
            }`}
            title={isLiked ? 'Unlike package' : 'Like package'}
          >
            <Heart
              className={`w-3.5 h-3.5 shrink-0 ${
                isLiked ? 'fill-rose-400 text-rose-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            />
            <span className="whitespace-nowrap">{pkg.likeCount ?? 0}</span>
          </button>

          {/* Quick Download */}
          <button
            onClick={handleDownloadClick}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 hover:border-cyan-600 transition whitespace-nowrap"
            title="Download .json package for Android app"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">{pkg.downloadCount ?? 0}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
