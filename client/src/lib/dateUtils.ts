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