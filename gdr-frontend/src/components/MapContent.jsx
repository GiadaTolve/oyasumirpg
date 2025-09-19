import React from 'react';
import { useOutletContext } from 'react-router-dom';

// --- STILI ---
const styles = {
    // Stili principali (invariati)
    subMapContainer: {
        width: '100%',
        height: '100%',
        padding: '0px',
        boxSizing: 'border-box',
    },
    mapDisplay: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        position: 'relative',
        height: '750px',
        padding: '20px',
        border: '1px solid #31323e',
        borderRadius: '8px',
        backgroundImage: 'url(/backgrounds/darkstone.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '250px',
    },
    locationColumn: { // Nome cambiato da chatColumn per generalizzare
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 2,
    },

    mapNameLabel: {
        position: 'absolute',
        bottom: '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#e6e0ff',
        padding: '5px 20px',
        borderRadius: '20px',
        border: '1px solid #4a4b57',
        fontSize: '1.1em',
        fontWeight: 'bold',
        zIndex: 1,
    },
    goBackButton: {
        position: 'absolute',
        top: '15px',
        left: '15px',
        zIndex: 10,
        padding: '4px 12px',
        fontSize: '12px',
        backgroundColor: 'rgba(30, 32, 44, 0.8)',
        border: '1px solid #4a4b57',
        color: '#bfc0d1',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    
    locationButton: {
      width: '350px',
      height: '70px',
      border: '2px solid rgb(171, 143, 19)', // Bordo dorato
      borderRadius: '3px',
      cursor: 'pointer',
      position: 'relative', // Necessario per posizionare l'immagine e il testo
      overflow: 'hidden', // Nasconde le parti dell'immagine che escono dai bordi
      padding: 0, // Rimuove il padding di default del bottone
      backgroundColor: '#111', // Sfondo di fallback se l'immagine non carica
  },
  // --- STILE MODIFICATO PER L'IMMAGINE ---
  locationImagePreview: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%', // Ora copre l'intera altezza del bottone
      objectFit: 'cover', // Scala l'immagine per coprire l'area, ritagliando se necessario
      zIndex: 1,
      filter: 'brightness(0.6)', // Scurisce l'immagine per rendere il testo più leggibile
  },
  locationName: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 2, // Sta sopra all'immagine
      color: 'white',
      fontWeight: 'bold',
      fontSize: '11px',
      textShadow: '1px 1px 3px black', // Ombra per migliorare la leggibilità
      width: '100%',
      textAlign: 'center',
  },
};
// Per completezza, ri-aggiungo gli stili che ho omesso con "..."
styles.mapNameLabel = {
  position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)',
  backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#e6e0ff', padding: '5px 20px',
  borderRadius: '20px', border: '1px solid #4a4b57', fontSize: '1.1em', fontWeight: 'bold', zIndex: 1,
};
styles.goBackButton = {
  position: 'absolute', top: '15px', left: '15px', zIndex: 10, padding: '4px 12px',
  fontSize: '12px', backgroundColor: 'rgba(30, 32, 44, 0.8)', border: '1px solid #4a4b57',
  color: '#bfc0d1', borderRadius: '5px', cursor: 'pointer',
};


// --- NUOVO SOTTO-COMPONENTE PER I BOTTONI ---
const LocationButton = ({ location, onClick }) => {
  // Usa un'immagine segnaposto se non c'è un'immagine specifica
  const imageUrl = location.image_url || '/backgrounds/darkstone.png';

  return (
      <button 
          style={styles.locationButton} 
          onClick={() => onClick(location)}
          title={location.name}
      >
          <img src={imageUrl} alt="" style={styles.locationImagePreview} />
          <span style={styles.locationName}>{location.name}</span>
      </button>
  );
};


function MapContent() {
  const { map, children, onZoneClick, onGoBack } = useOutletContext();

  if (!map) {
      return <div>Caricamento mappa...</div>;
  }

  const isRootMap = map.parent_id === null;

  // CASO 1: MAPPA RADICE (MOSAICO - INVARIATO)
  if (isRootMap) {
      return (
          <div className="map-container">
              <img src={map.image_url} alt={map.name} className="map-image" />
              {children.map(child => (
                  <img
                      key={child.id}
                      src={child.image_url}
                      alt={child.name}
                      className="map-tile"
                      style={{
                          left: `${child.pos_x}%`,
                          top: `${child.pos_y}%`,
                          width: child.description || 'auto',
                      }}
                      onClick={() => onZoneClick(child)}
                      title={`Vai a ${child.name}`}
                  />
              ))}
          </div>
      );
  }

  // --- CASO 2: SOTTOMAPPA (LAYOUT AGGIORNATO) ---
  // Ora non filtriamo più, li trattiamo tutti allo stesso modo
  const leftLocations = children.filter((_, index) => index % 2 === 0);
  const rightLocations = children.filter((_, index) => index % 2 !== 0);

  return (
      <div style={styles.subMapContainer}>
          <div style={styles.mapDisplay}>
              
              {map.parent_id && (
                  <button onClick={onGoBack} style={styles.goBackButton}>
                      &larr; Torna Indietro
                  </button>
              )}

              {/* Colonna Sinistra */}
              <div style={styles.locationColumn}>
                  {leftLocations.map(location => (
                      <LocationButton key={location.id} location={location} onClick={onZoneClick} />
                  ))}
              </div>
              
              {/* Colonna Destra */}
              <div style={styles.locationColumn}>
                  {rightLocations.map(location => (
                      <LocationButton key={location.id} location={location} onClick={onZoneClick} />
                  ))}
              </div>

              <h2 style={styles.mapNameLabel}>{map.name}</h2>
          </div>
      </div>
  );
}

export default MapContent;

