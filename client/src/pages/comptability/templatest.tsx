import React, { useState } from 'react';
import invoice1 from '../../../assets/fatures/affiche1.png';
import invoice2 from '../../../assets/fatures/affiche2.png';
import invoice3 from '../../../assets/fatures/affiche3.png';

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    header: {
        textAlign: 'center' as const,
        marginBottom: '2rem',
        color: '#2C3E50',
        borderBottom: '2px solid #E5E7EB',
        paddingBottom: '1rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        padding: '1rem',
    },
    card: {
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '1.5rem',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
    },
    image: {
        width: '100%',
        height: '200px',
        objectFit: 'cover' as const,
        borderRadius: '12px',
        marginBottom: '1rem',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: '0.5rem',
    },
    description: {
        color: '#6B7280',
        marginBottom: '1.5rem',
        lineHeight: '1.5',
    },
    button: {
        width: '100%',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#3B82F6',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
    },
    searchContainer: {
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'center',
    },
    searchInput: {
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        width: '100%',
        maxWidth: '400px',
        fontSize: '1rem',
    },
};

const templatest: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const templates = [
        {
            id: 1,
            title: 'Professional Invoice',
            description: 'Clean and modern invoice template for business use.',
            image: invoice1,
        },
        {
            id: 2,
            title: 'Simple Invoice',
            description: 'Straightforward and easy-to-read invoice layout.',
            image: invoice2,
        },
        {
            id: 3,
            title: 'Detailed Invoice',
            description: 'Comprehensive invoice template with detailed breakdown.',
            image: invoice3,
        },
    ];

    const filteredTemplates = templates.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const downloadPDF = (templateId: number) => {
        console.log(`Downloading PDF for template ${templateId}`);
        // Add loading state and success/error notifications here
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Invoice Templates</h1>
            
            <div style={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search templates..."
                    style={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={styles.grid}>
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        style={{
                            ...styles.card,
                            transform: hoveredId === template.id ? 'translateY(-5px)' : 'none',
                            boxShadow: hoveredId === template.id 
                                ? '0 10px 15px rgba(0, 0, 0, 0.1)' 
                                : styles.card.boxShadow,
                        }}
                        onMouseEnter={() => setHoveredId(template.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        <img src={template.image} alt={template.title} style={styles.image} />
                        <h2 style={styles.title}>{template.title}</h2>
                        <p style={styles.description}>{template.description}</p>
                        <button
                            style={{
                                ...styles.button,
                                backgroundColor: hoveredId === template.id ? '#2563EB' : '#3B82F6',
                            }}
                            onClick={() => downloadPDF(template.id)}
                        >
                            <span>Download PDF</span>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default templatest;