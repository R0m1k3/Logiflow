import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className = '',
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const visiblePages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          visiblePages.push(i);
        }
        visiblePages.push('...');
        visiblePages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        visiblePages.push(1);
        visiblePages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        visiblePages.push(1);
        visiblePages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push('...');
        visiblePages.push(totalPages);
      }
    }

    return visiblePages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-700">
          Affichage de <span className="font-medium">{startItem}</span> à{' '}
          <span className="font-medium">{endItem}</span> sur{' '}
          <span className="font-medium">{totalItems}</span> résultats
        </p>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Afficher:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </Button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <span key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="w-10"
                >
                  {page}
                </Button>
              )}
            </span>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Suivant
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Additional components for compatibility
export const PaginationContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const PaginationEllipsis = () => <span>...</span>;
export const PaginationItem = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;
export const PaginationLink = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;
export const PaginationNext = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;
export const PaginationPrevious = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;

// Export usePagination hook
export { usePagination } from "@/hooks/usePagination";