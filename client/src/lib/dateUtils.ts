import { format, parseISO, isValid } from 'date-fns';

export function safeFormat(date: string | Date | null | undefined, formatString: string): string {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'N/A';
    }
    
    if (!isValid(dateObj)) {
      return 'N/A';
    }
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'N/A';
  }
}

export function safeDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return null;
    }
    
    if (!isValid(dateObj)) {
      return null;
    }
    
    return dateObj;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}

// Additional utility function for date comparison
export function safeCompareDate(dateA: Date | string | null | undefined, dateB: Date | string | null | undefined): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  
  const parsedA = safeDate(dateA);
  const parsedB = safeDate(dateB);
  
  if (!parsedA && !parsedB) return 0;
  if (!parsedA) return 1;
  if (!parsedB) return -1;
  
  return parsedA.getTime() - parsedB.getTime();
}