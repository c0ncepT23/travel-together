import { TravelDocument } from '../../store/reducers/profileReducer';

/**
 * This is a simplified document parser that would be much more sophisticated in a real app.
 * In a production environment, this would likely:
 * 1. Use OCR (Optical Character Recognition) to extract text from PDFs or images
 * 2. Use NLP or ML models to identify travel information
 * 3. Make API calls to validate flight numbers, hotel bookings, etc.
 */

interface ExtractedDocumentInfo {
  type: 'flight' | 'hotel' | 'other';
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  details?: {
    flightNumber?: string;
    airline?: string;
    hotelName?: string;
    bookingReference?: string;
  };
}

export interface ParseResult {
  success: boolean;
  data?: ExtractedDocumentInfo;
  error?: string;
}

/**
 * Extracts travel information from text content
 * @param text The text content extracted from document
 */
export const extractTravelInfo = (text: string): ParseResult => {
  // Normalize text for case-insensitive matching
  const normalizedText = text.toLowerCase();
  
  try {
    // Determine document type
    let documentType: 'flight' | 'hotel' | 'other' = 'other';
    
    // Check for flight indicators
    if (
      normalizedText.includes('flight') ||
      normalizedText.includes('airline') ||
      normalizedText.includes('boarding') ||
      normalizedText.includes('reservation') ||
      normalizedText.includes('confirmation')
    ) {
      documentType = 'flight';
    }
    // Check for hotel indicators
    else if (
      normalizedText.includes('hotel') ||
      normalizedText.includes('reservation') ||
      normalizedText.includes('booking') ||
      normalizedText.includes('stay') ||
      normalizedText.includes('accommodation')
    ) {
      documentType = 'hotel';
    }
    
    // Extract dates - In a real app, this would be much more sophisticated
    // looking for various date formats
    const dateRegex = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g;
    const dates = [...normalizedText.matchAll(dateRegex)].map(match => {
      // Handle different date formats and normalize to yyyy-mm-dd
      let day = parseInt(match[1]);
      let month = parseInt(match[2]);
      let year = parseInt(match[3]);
      
      // Handle 2-digit years
      if (year < 100) {
        year += 2000; // Assume 20xx for now
      }
      
      // Validate and fix swapped day/month if needed
      if (month > 12) {
        [day, month] = [month, day];
      }
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    });
    
    // Sort dates to determine start and end
    dates.sort();
    
    // If we don't have at least two dates, try to extract them differently
    // or use the current date as a fallback
    const startDate = dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0];
    const endDate = dates.length > 1 ? dates[1] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Extract destination - this would be more sophisticated in a real app
    // using NLP to identify place names
    const destinations = [
      'bangkok', 'tokyo', 'new york', 'paris', 'london', 'rome', 'sydney',
      'hong kong', 'singapore', 'dubai', 'los angeles', 'bali', 'phuket',
      'seoul', 'barcelona', 'istanbul', 'amsterdam', 'miami', 'shanghai',
      'las vegas', 'milan', 'madrid', 'berlin', 'vienna', 'prague', 'moscow',
      'athens', 'cairo', 'marrakesh', 'johannesburg', 'rio de janeiro',
      'toronto', 'vancouver', 'san francisco', 'chicago', 'boston', 'orlando',
      'kyoto', 'osaka', 'taipei', 'kuala lumpur', 'delhi', 'mumbai',
      'melbourne', 'auckland', 'fiji', 'hawaii', 'cancun', 'mexico city',
      'bangkok', 'chiang mai', 'pattaya', 'thailand', 'japan'
    ];
    
    let destination = 'Unknown';
    for (const place of destinations) {
      if (normalizedText.includes(place)) {
        destination = place.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        break;
      }
    }
    
    // Extract additional details based on document type
    const details: any = {};
    
    if (documentType === 'flight') {
      // Extract airline
      const airlines = [
        'thai airways', 'japan airlines', 'ana', 'delta', 'united',
        'american airlines', 'british airways', 'air france', 'lufthansa',
        'emirates', 'qatar airways', 'singapore airlines', 'cathay pacific',
        'air canada', 'turkish airlines', 'etihad airways', 'klm',
        'air china', 'korean air', 'southwest', 'jetblue', 'virgin atlantic'
      ];
      
      for (const airline of airlines) {
        if (normalizedText.includes(airline)) {
          details.airline = airline.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          break;
        }
      }
      
      // Extract flight number
      const flightNumberRegex = /\b([a-z]{2,3})\s*(\d{1,4})\b/i;
      const flightNumberMatch = normalizedText.match(flightNumberRegex);
      if (flightNumberMatch) {
        details.flightNumber = `${flightNumberMatch[1].toUpperCase()}${flightNumberMatch[2]}`;
      }
    } else if (documentType === 'hotel') {
      // Extract hotel name - in a real app this would be more sophisticated
      const hotelKeywords = [
        'hotel', 'resort', 'inn', 'suites', 'plaza', 'palace',
        'grand', 'hyatt', 'hilton', 'marriott', 'sheraton', 'westin',
        'intercontinental', 'radisson', 'novotel'
      ];
      
      for (const keyword of hotelKeywords) {
        const regex = new RegExp(`(\\w+\\s+${keyword}|${keyword}\\s+\\w+)`, 'i');
        const match = normalizedText.match(regex);
        if (match) {
          details.hotelName = match[0].split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          break;
        }
      }
      
      // Extract booking reference
      const bookingRefRegex = /\b(confirmation|booking|reservation|ref|reference|number):?\s*([a-z0-9]{5,10})\b/i;
      const bookingRefMatch = normalizedText.match(bookingRefRegex);
      if (bookingRefMatch) {
        details.bookingReference = bookingRefMatch[2].toUpperCase();
      }
    }
    
    // Generate title if we have enough info
    let title = '';
    if (documentType === 'flight' && details.airline) {
      title = `${details.airline} to ${destination}`;
    } else if (documentType === 'hotel' && details.hotelName) {
      title = `${details.hotelName}`;
    } else {
      title = `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} - ${destination}`;
    }
    
    return {
      success: true,
      data: {
        type: documentType,
        title,
        destination,
        startDate,
        endDate,
        details
      }
    };
  } catch (error) {
    console.error('Error parsing document:', error);
    return {
      success: false,
      error: 'Failed to extract travel information from document'
    };
  }
};

/**
 * Main function to parse a document file
 * @param fileUri URI of the document file
 * @param fileType Type of the file (pdf, image, etc.)
 */
export const parseDocument = async (
  fileUri: string,
  fileType: string
): Promise<ParseResult> => {
  try {
    // In a real app, this would:
    // 1. Upload the file to a server or use a local OCR library
    // 2. Extract text from the document based on file type
    // 3. Process the text to extract travel information
    
    // For this demo, we'll simulate successful extraction with mock data
    const mockExtractedText = `
      BOARDING PASS
      THAI AIRWAYS TG315
      Bangkok to Phuket
      Passenger: John Smith
      Date: 02/06/2025
      Return: 10/06/2025
      Confirmation: ABC123
    `;
    
    return extractTravelInfo(mockExtractedText);
  } catch (error) {
    console.error('Error parsing document:', error);
    return {
      success: false,
      error: 'Failed to parse document'
    };
  }
};