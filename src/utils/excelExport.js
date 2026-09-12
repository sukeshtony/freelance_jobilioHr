import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const exportCandidatesToExcel = (candidates) => {
    // Prepare data for Excel export
    const excelData = candidates.map((candidate, index) => {
        const user = typeof candidate.userId === 'object' && candidate.userId !== null ? candidate.userId : {
            username: candidate.username || '',
            email: candidate.email || '',
            mobile: candidate.mobile || ''
        };

        const profile = candidate.profile || {};
        
        // Create hyperlinks for different views
        const baseUrl = window.location.origin;
        const profileViewUrl = `${baseUrl}/candidate-profile/${candidate._id}`;
        const resumeUrl = profile.resumeUrl || 'N/A';
        
        return {
            'Sr No': index + 1,
            'Username': user.username || 'N/A',
            'Email': user.email || 'N/A',
            'Mobile': user.mobile || 'N/A',
            'Job Title': profile.title || 'N/A',
            'Experience (Years)': profile.experience || 'N/A',
            'City': profile.city || 'N/A',
            'Phone': profile.phone || 'N/A',
            'Registration Date': candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'N/A',
            'Profile Status': profile.isDraft ? 'Draft' : 'Complete',
            'View Profile': profileViewUrl,
            'Candidate ID': candidate._id
        };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Add hyperlink styling and formatting
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Style the hyperlink column (View Profile)
    const hyperlinkCol = 9; // Column J (View Profile)
    const colLetter = XLSX.utils.encode_col(hyperlinkCol);
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellAddress = colLetter + (row + 1);
        const cell = worksheet[cellAddress];
        if (cell && cell.v !== 'N/A') {
            // Add hyperlink
            if (!worksheet['!links']) worksheet['!links'] = [];
            worksheet['!links'].push({
                Target: cell.v,
                Location: cellAddress,
                Text: 'View Details'
            });
            
            // Style the cell
            if (!worksheet['!styles']) worksheet['!styles'] = {};
            if (!worksheet['!styles'][cellAddress]) worksheet['!styles'][cellAddress] = {};
            worksheet['!styles'][cellAddress].font = {
                color: { rgb: '0000FF' },
                underline: true
            };
        }
    }

    // Set column widths
    const columnWidths = [
        { wch: 8 },   // Sr No
        { wch: 20 },  // Username
        { wch: 30 },  // Email
        { wch: 15 },  // Mobile
        { wch: 25 },  // Job Title
        { wch: 15 },  // Experience
        { wch: 15 },  // City
        { wch: 15 },  // Phone
        { wch: 15 },  // Registration Date
        { wch: 15 },  // Profile Status
        { wch: 50 },  // View Profile
        { wch: 30 }   // Candidate ID
    ];
    worksheet['!cols'] = columnWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false
    });
    
    const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Save the file
    const fileName = `candidates_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, fileName);
};

// Alternative method using CSV with hyperlinks (more compatible)
export const exportCandidatesToCSV = (candidates) => {
    const headers = [
        'Sr No',
        'Username',
        'Email', 
        'Mobile',
        'Job Title',
        'Experience (Years)',
        'City',
        'Phone',
        'Registration Date',
        'Profile Status',
        'View Profile Link',
        'Candidate ID'
    ];

    const csvData = candidates.map((candidate, index) => {
        const user = typeof candidate.userId === 'object' && candidate.userId !== null ? candidate.userId : {
            username: candidate.username || '',
            email: candidate.email || '',
            mobile: candidate.mobile || ''
        };

        const profile = candidate.profile || {};
        const baseUrl = window.location.origin;
        
        return [
            index + 1,
            user.username || 'N/A',
            user.email || 'N/A',
            user.mobile || 'N/A',
            profile.title || 'N/A',
            profile.experience || 'N/A',
            profile.city || 'N/A',
            profile.phone || 'N/A',
            candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'N/A',
            profile.isDraft ? 'Draft' : 'Complete',
            `${baseUrl}/candidate-profile/${candidate._id}`,
            candidate._id
        ];
    });

    const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `candidates_export_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
};
