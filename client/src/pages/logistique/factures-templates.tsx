import React from 'react';
import invoice1 from '../../../assets/fatures/affiche1.png';
import invoice2 from '../../../assets/fatures/affiche2.png';
import invoice3 from '../../../assets/fatures/affiche3.png';

const cardStyle = {
    border: '1px solid #ccc',
    padding: '20px',
    borderRadius: '12px',
    width: '300px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    backgroundColor: '#fff',
    cursor: 'pointer',
    textAlign: 'center' as 'center',
};

const cardHoverStyle = {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
};

const imageStyle = {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
    marginBottom: '10px',
};

const buttonStyle = {
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
};

const buttonHoverStyle = {
    backgroundColor: '#0056b3',
};

const FacturesTemplates: React.FC = () => {
    const templates = [
        {
            id: 1,
            title: 'Template 1',
            description: 'This is the first template for logistics.',
            image: invoice1,
        },
        {
            id: 2,
            title: 'Template 2',
            description: 'This is the second template for logistics.',
            image: invoice2,
        },
        {
            id: 3,
            title: 'Template 3',
            description: 'This is the third template for logistics.',
            image: invoice3,
        },
    ];

    const downloadPDF = (templateId: number) => {
        // Logic to generate and download the PDF for the selected template
        console.log(`Downloading PDF for template ${templateId}`);
    };

    return (
        <div>
            <h1>Logistics Templates</h1>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {templates.map((template) => (
                    <div
                        key={template.id}
                        style={cardStyle}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = cardHoverStyle.transform;
                            (e.currentTarget as HTMLElement).style.boxShadow = cardHoverStyle.boxShadow;
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = '';
                            (e.currentTarget as HTMLElement).style.boxShadow = '';
                        }}
                    >
                        <img src={template.image} alt={template.title} style={imageStyle} />
                        <h2>{template.title}</h2>
                        <p>{template.description}</p>
                        <button
                            style={buttonStyle}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = buttonHoverStyle.backgroundColor;
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = buttonStyle.backgroundColor;
                            }}
                            onClick={() => downloadPDF(template.id)}
                        >
                            Download as PDF
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FacturesTemplates;