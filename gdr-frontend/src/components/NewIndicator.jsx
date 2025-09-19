// src/components/NewIndicator.jsx
import React from 'react';

const styles = {
    indicator: {
        color: 'white',
        padding: '2px 8px',
        fontSize: '0.6em',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        animation: 'glow 1.5s infinite alternate',
        marginLeft: '8px',
        fontFamily: 'sans-serif',
    },
};

function NewIndicator() {
    return <span style={styles.indicator}>New!</span>;
}

export default NewIndicator;