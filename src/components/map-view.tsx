
'use client';
// CSS must be imported first
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import * as React from 'react';
import L, { type Map } from 'leaflet';
import 'leaflet-draw';

import type { MeshUnit, UnitStatus, UnitType } from '@/types/mesh';
import { Globe, Map as MapIcon, Target, Flame, Droplets, Star, ParkingCircle, TriangleAlert, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapViewProps {
  units: MeshUnit[];
  highlightedUnitId: number | null;
  controlCenterPosition: { lat: number; lng: number } | null;
  drawnItems: any[];
  onMapClick: (position: { lat: number; lng: number }) => void;
  onUnitClick?: (unitId: number) => void;
  onShapesChange: (featureGroup: L.FeatureGroup) => void;
  isPositioningMode: boolean;
}

type MapStyle = 'satellite' | 'street';

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

const INITIAL_CENTER: L.LatLngExpression = [53.19745, 10.84507];
const MAX_ZOOM = 20;

const TACTICAL_SYMBOLS: Record<string, { icon: React.FC<React.SVGProps<SVGSVGElement>>, tooltip: string, color: string }> = {
  'fire-source': { icon: Flame, tooltip: 'Brandherd', color: 'text-orange-500' },
  'water-source': { icon: Droplets, tooltip: 'Wasserentnahmestelle', color: 'text-blue-500' },
  'command-post': { icon: Star, tooltip: 'Einsatzleitung', color: 'text-yellow-400' },
  'staging-area': { icon: ParkingCircle, tooltip: 'Bereitstellungsraum', color: 'text-gray-400' },
  'danger-zone': { icon: TriangleAlert, tooltip: 'Gefahrenbereich', color: 'text-red-500' },
  'wind-direction': { icon: Wind, tooltip: 'Windrichtung', color: 'text-sky-400' },
};


const createSymbolIcon = (symbolKey: string) => {
    const symbol = TACTICAL_SYMBOLS[symbolKey];
    if (!symbol) return new L.Icon.Default();
    
    // We render the Lucide icon to an HTML string. This is a bit of a hack.
    const iconHtml = `
        <div class="bg-background/80 border border-foreground/50 rounded-md p-1 w-8 h-8 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${symbol.color}">
                <use href="#${symbol.icon.displayName || symbol.icon.name}" />
            </svg>
        </div>`;

    return L.divIcon({
        html: iconHtml,
        className: 'tactical-symbol-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};


const STATUS_COLORS: Record<UnitStatus, string> = {
  Online: '#60a5fa',    // tailwind blue-400
  Moving: '#4ade80',    // tailwind green-400
  Idle: '#38bdf8',      // tailwind sky-400
  Alarm: '#f87171',     // tailwind red-400
  Offline: '#9ca3af',   // tailwind gray-400
  Maintenance: '#f97316', // tailwind orange-500
};

const createStatusIcon = (status: UnitStatus, unitType: UnitType, isHighlighted: boolean) => {
  const color = STATUS_COLORS[status] || '#9ca3af';
  const alarmAnimationClass = status === 'Alarm' ? 'animate-pulse' : '';
  const highlightDropShadow = isHighlighted ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : '';

  const iconPaths = {
    Vehicle: `
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1h2"></path>
      <path d="M14 17h-4"></path>
      <path d="M15 7h-5"></path>
      <path d="M5 17v-4h4"></path>
      <circle cx="7" cy="17" r="2"></circle>
      <circle cx="17" cy="17" r="2"></circle>
    `,
    Personnel: `
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    `,
  };

  const iconPath = iconPaths[unitType] || '';
  const iconColor = '#fff';

  const iconHtml = `
    <div class="relative flex items-center justify-center ${alarmAnimationClass}">
      <svg class="h-10 w-10 ${highlightDropShadow}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 42 16 42C16 42 32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
        <circle cx="16" cy="16" r="8" fill="white"/>
        <svg x="8" y="8" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="${color}" fill="none" stroke-linecap="round" stroke-linejoin="round">
          ${iconPath}
        </svg>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [40, 42],
    iconAnchor: [20, 42],
    popupAnchor: [0, -42],
  });
};

const createControlCenterIcon = () => {
  const color = 'hsl(221, 83%, 58%)'; 
  
  const iconHtml = `
    <div class="relative flex items-center justify-center">
      <svg class="h-10 w-10" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 42 16 42C16 42 32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
        <path d="M16 11L18.09 15.26L23 15.9L19.5 19.29L20.18 24L16 21.75L11.82 24L12.5 19.29L9 15.9L13.91 15.26L16 11Z" fill="white"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [40, 42],
    iconAnchor: [20, 42],
    popupAnchor: [0, -42],
  });
};


const TacticalToolbar = ({ onSelect, selectedSymbol }: { onSelect: (key: string | null) => void, selectedSymbol: string | null }) => (
  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 p-1 bg-background/80 rounded-lg border shadow-lg">
    {Object.entries(TACTICAL_SYMBOLS).map(([key, { icon: Icon, tooltip }]) => (
      <Button
        key={key}
        variant={selectedSymbol === key ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onSelect(selectedSymbol === key ? null : key)}
        title={tooltip}
        className='h-9 w-9'
      >
        <Icon className="w-5 h-5" />
      </Button>
    ))}
  </div>
);


export default function MapView({ units, highlightedUnitId, controlCenterPosition, drawnItems, onMapClick, onUnitClick, onShapesChange, isPositioningMode }: MapViewProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<Map | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);
  const editableLayersRef = React.useRef<L.FeatureGroup | null>(null);
  const markersRef = React.useRef<Record<number, L.Marker>>({});
  const controlCenterMarkerRef = React.useRef<L.Marker | null>(null);
  const isInitiallyCenteredRef = React.useRef(false);
  
  const [mapStyle, setMapStyle] = React.useState<MapStyle>('street');
  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);

  const handleRecenter = React.useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const activeUnits = units.filter(u => u.isActive);

    if (activeUnits.length > 0) {
      const bounds = L.latLngBounds(activeUnits.map(u => [u.position.lat, u.position.lng]));
      if (controlCenterPosition) {
        bounds.extend([controlCenterPosition.lat, controlCenterPosition.lng]);
      }
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: MAX_ZOOM });
      }
    } else if (controlCenterPosition) {
        map.setView([controlCenterPosition.lat, controlCenterPosition.lng], 16);
    } 
    else {
        map.setView(INITIAL_CENTER, 16);
    }
  }, [units, controlCenterPosition]);

  // Initialize map and handle cleanup
  React.useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
          center: INITIAL_CENTER,
          zoom: 16,
          maxZoom: MAX_ZOOM,
          scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      tileLayerRef.current = L.tileLayer(TILE_LAYERS.street.url, {
          attribution: TILE_LAYERS.street.attribution,
      }).addTo(map);

      editableLayersRef.current = new L.FeatureGroup().addTo(map);

      setTimeout(() => map.invalidateSize(), 100);
    }

    const map = mapInstanceRef.current;
    
    return () => {
        if (map && !mapContainerRef.current) { 
            map.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Effect to handle all event listeners that depend on changing props
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const editableLayers = editableLayersRef.current;
    if (!map || !editableLayers) return;
    
    // Clear old layers before adding new ones
    editableLayers.clearLayers();
    
    // Load saved drawings and symbols
    drawnItems.forEach(itemGeoJson => {
      // Check if it's a custom symbol marker
      if (itemGeoJson.geometry.type === 'Point' && itemGeoJson.properties?.symbol) {
        const symbolKey = itemGeoJson.properties.symbol;
        const coords = itemGeoJson.geometry.coordinates;
        const marker = L.marker([coords[1], coords[0]], {
          icon: createSymbolIcon(symbolKey),
        });
        marker.feature = itemGeoJson as any;
        editableLayers.addLayer(marker);
      } else {
        // It's a regular shape from leaflet-draw
        const layer = L.geoJSON(itemGeoJson);
        layer.eachLayer(l => editableLayers.addLayer(l));
      }
    });

    const drawControl = new L.Control.Draw({
        edit: { featureGroup: editableLayers },
        draw: {
            polygon: { allowIntersection: false, showArea: true },
            polyline: true,
            rectangle: true,
            circle: true,
            marker: false, // Replaced by our custom symbols
            circlemarker: false,
        },
    });
    map.addControl(drawControl);

    const handleShapeEvent = () => onShapesChange(editableLayers);

    map.on(L.Draw.Event.CREATED, (event: L.DrawEvents.Created) => {
        editableLayers.addLayer(event.layer);
        handleShapeEvent();
    });
    map.on(L.Draw.Event.EDITED, handleShapeEvent);
    map.on(L.Draw.Event.DELETED, handleShapeEvent);

    const handleClick = (e: L.LeafletMouseEvent) => {
        if (selectedSymbol) {
            const newMarker = L.marker(e.latlng, { icon: createSymbolIcon(selectedSymbol) });
            const feature = (newMarker as any).toGeoJSON();
            feature.properties.symbol = selectedSymbol;
            (newMarker as any).feature = feature;
            editableLayers.addLayer(newMarker);
            handleShapeEvent();
            setSelectedSymbol(null); // Exit symbol placement mode
        } else {
             onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    };
    map.on('click', handleClick);

    // Cleanup function for this effect
    return () => {
        map.off('click', handleClick);
        map.off(L.Draw.Event.CREATED);
        map.off(L.Draw.Event.EDITED);
        map.off(L.Draw.Event.DELETED);
        
        try {
            map.removeControl(drawControl);
        } catch(e) { /* ignore */ }
    };
  }, [onMapClick, onShapesChange, drawnItems, selectedSymbol]);

  // Update cursor style for various modes
  React.useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (mapContainer) {
      if (isPositioningMode || selectedSymbol) {
        mapContainer.style.cursor = 'crosshair';
      } else {
        mapContainer.style.cursor = ''; // Reset to default
      }
    }
  }, [isPositioningMode, selectedSymbol]);

  // Update tile layer style
  React.useEffect(() => {
      if (tileLayerRef.current && mapInstanceRef.current) {
          tileLayerRef.current.setUrl(TILE_LAYERS[mapStyle].url);
          tileLayerRef.current.options.attribution = TILE_LAYERS[mapStyle].attribution;
      }
  }, [mapStyle]);

  // Manage all markers (Units and Control Center)
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing unit/control markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    if (controlCenterMarkerRef.current) {
        controlCenterMarkerRef.current.remove();
        controlCenterMarkerRef.current = null;
    }

    // Add/Update unit markers
    units.forEach(unit => {
        const position: L.LatLngExpression = [unit.position.lat, unit.position.lng];
        const tooltipContent = `
            <strong>${unit.name} (${unit.type})</strong><br>
            <span>
                Status: ${unit.status}<br>
                Akku: ${unit.battery}%
            </span>`;
        
        const isHighlighted = unit.id === highlightedUnitId;
        const icon = createStatusIcon(unit.status, unit.type, isHighlighted);
        
        const marker = L.marker(position, { icon })
          .addTo(map)
          .bindTooltip(tooltipContent);
        
        marker.setZIndexOffset(isHighlighted ? 1000 : unit.id);

        if (onUnitClick) {
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                onUnitClick(unit.id);
            });
        }

        markersRef.current[unit.id] = marker;
    });

    // Add/Update control center marker
    if (controlCenterPosition) {
        const position: L.LatLngExpression = [controlCenterPosition.lat, controlCenterPosition.lng];
        const tooltipContent = `<strong>Leitstelle</strong>`;
        
        const icon = createControlCenterIcon();
        
        const marker = L.marker(position, { icon, zIndexOffset: 1100 })
          .bindTooltip(tooltipContent).addTo(map);

        controlCenterMarkerRef.current = marker;
    }
  }, [units, highlightedUnitId, controlCenterPosition, onUnitClick]);

  // Perform initial centering only once
  React.useEffect(() => {
    if (!isInitiallyCenteredRef.current && (units.some(u => u.isActive) || controlCenterPosition)) {
      handleRecenter();
      isInitiallyCenteredRef.current = true;
    }
  }, [units, controlCenterPosition, handleRecenter]);


  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border bg-background">
      {/* This SVG definition block is for the tactical symbols to use */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {Object.entries(TACTICAL_SYMBOLS).map(([key, { icon: Icon }]) => (
            <g id={Icon.displayName || Icon.name} key={key}>
              <Icon />
            </g>
          ))}
        </defs>
      </svg>
      
      <div ref={mapContainerRef} className="h-full w-full z-0" />
      
      <TacticalToolbar onSelect={setSelectedSymbol} selectedSymbol={selectedSymbol} />

      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
            variant="secondary"
            size="icon"
            onClick={handleRecenter}
            title="Auf Einheiten zentrieren"
        >
            <Target className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setMapStyle(style => style === 'satellite' ? 'street' : 'satellite')}
          title={mapStyle === 'satellite' ? 'Straßenansicht' : 'Satellitenansicht'}
        >
          {mapStyle === 'satellite' ? <MapIcon className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
