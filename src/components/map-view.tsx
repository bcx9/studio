
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

type MapStyle = 'satellite' | 'street' | 'dark';

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }
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
        <div class="bg-background/80 border border-border rounded-md p-1 w-8 h-8 flex items-center justify-center">
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


const STATUS_COLORS: Record<string, string> = {
  Online: '#22d3ee', // cyan-400
  Moving: '#34d399', // emerald-400
  Idle: '#60a5fa', // blue-400
  Alarm: '#f87171', // red-400
  Offline: '#9ca3af', // gray-400
  Maintenance: '#f97316', // orange-500
};

const createStatusIcon = (status: UnitStatus, unitType: UnitType, isHighlighted: boolean) => {
  const color = STATUS_COLORS[status] || '#9ca3af';
  const alarmAnimationClass = status === 'Alarm' ? 'animate-pulse' : '';
  const highlightScale = isHighlighted ? 'scale-110' : 'scale-100';

  const iconPaths: Record<string, string> = {
    Vehicle: `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1h2"/><path d="M14 17h-4"/><path d="M15 7h-5"/><path d="M5 17v-4h4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>`,
    Personnel: `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  };
  const genericIconPath = `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" x2="12" y1="22.08" y2="12" />`;
  const iconPath = iconPaths[unitType] || genericIconPath;

  const iconHtml = `
    <div 
      class="relative flex items-center justify-center transition-transform duration-200 ${highlightScale} ${alarmAnimationClass}"
      style="filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.1));"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
              <linearGradient id="neumorphic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:hsl(var(--background)); stop-opacity:0.5" />
                  <stop offset="100%" style="stop-color:hsl(var(--background)); stop-opacity:1" />
              </linearGradient>
              <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#d1d9e6" />
                  <feDropShadow dx="-2" dy="-2" stdDeviation="2" flood-color="#ffffff" />
              </filter>
          </defs>
          <g filter="url(#dropshadow)">
            <circle cx="20" cy="20" r="18" fill="url(#neumorphic-gradient)"/>
            <circle cx="20" cy="20" r="18" stroke="hsl(var(--border))" stroke-width="0.5"/>
          </g>
          <svg x="8" y="8" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="${color}" fill="none" stroke-linecap="round" stroke-linejoin="round">
              ${iconPath}
          </svg>
          <circle cx="30" cy="10" r="4" fill="${color}" stroke="#fff" stroke-width="2" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const createControlCenterIcon = () => {
  const color = 'hsl(var(--primary))'; 
  
  const iconHtml = `
    <div class="relative flex items-center justify-center">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="cc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:hsl(var(--background)); stop-opacity:0.5" />
                    <stop offset="100%" style="stop-color:hsl(var(--background)); stop-opacity:1" />
                </linearGradient>
                 <filter id="cc-dropshadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="3" dy="3" stdDeviation="3" flood-color="#d1d9e6" />
                  <feDropShadow dx="-3" dy="-3" stdDeviation="3" flood-color="#ffffff" />
                </filter>
            </defs>
            <g filter="url(#cc-dropshadow)">
              <circle cx="26" cy="26" r="24" fill="url(#cc-gradient)"/>
              <circle cx="26" cy="26" r="24" stroke="hsl(var(--border))" stroke-width="1"/>
            </g>
             <path d="M26 20L28.32 24.8L33.5 25.5L29.75 29.1L30.64 34L26 31.4L21.36 34L22.25 29.1L18.5 25.5L23.68 24.8L26 20Z" fill="${color}"/>
        </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -26],
  });
};


const TacticalToolbar = ({ onSelect, selectedSymbol }: { onSelect: (key: string | null) => void, selectedSymbol: string | null }) => (
  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 p-1 bg-background/60 backdrop-blur-sm rounded-full neumorphic-shadow shadow-inner">
    {Object.entries(TACTICAL_SYMBOLS).map(([key, { icon: Icon, tooltip }]) => (
      <Button
        key={key}
        variant={selectedSymbol === key ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => onSelect(selectedSymbol === key ? null : key)}
        title={tooltip}
        className="h-10 w-10 rounded-full"
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
          zoomControl: false,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);

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
        const layer = L.geoJSON(itemGeoJson, {
          style: (feature) => ({
            color: 'hsl(var(--primary))',
            weight: 3,
            opacity: 0.8,
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 0.2,
          })
        });
        layer.eachLayer(l => editableLayers.addLayer(l));
      }
    });

    const drawControl = new L.Control.Draw({
        edit: { featureGroup: editableLayers },
        draw: {
            polygon: { 
              allowIntersection: false, 
              showArea: true,
              shapeOptions: { color: 'hsl(var(--primary))' },
            },
            polyline: { shapeOptions: { color: 'hsl(var(--primary))', weight: 3 } },
            rectangle: { shapeOptions: { color: 'hsl(var(--primary))' } },
            circle: { shapeOptions: { color: 'hsl(var(--primary))' } },
            marker: false, // Replaced by our custom symbols
            circlemarker: false,
        },
        position: 'bottomright'
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
            <div class="font-semibold text-base">${unit.name} (${unit.type})</div>
            <div class="text-sm">
                Status: ${unit.status}<br>
                Akku: ${unit.battery}%
            </span>`;
        
        const isHighlighted = unit.id === highlightedUnitId;
        const icon = createStatusIcon(unit.status, unit.type, isHighlighted);
        
        const marker = L.marker(position, { icon })
          .addTo(map)
          .bindTooltip(tooltipContent, {
            className: 'neumorphic-tooltip',
            offset: [0, -20]
          });
        
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
        const tooltipContent = `<strong class="font-semibold text-base">Leitstelle</strong>`;
        
        const icon = createControlCenterIcon();
        
        const marker = L.marker(position, { icon, zIndexOffset: 1100 })
          .bindTooltip(tooltipContent, { className: 'neumorphic-tooltip' }).addTo(map);

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
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-background neumorphic-shadow-inset">
      <style>{`
        .leaflet-tooltip.neumorphic-tooltip {
          background-color: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          border-radius: var(--radius);
          box-shadow: 4px 4px 8px hsl(var(--background) / 0.5), -4px -4px 8px #ffffff;
        }
        .leaflet-tooltip-top.neumorphic-tooltip::before,
        .leaflet-tooltip-bottom.neumorphic-tooltip::before,
        .leaflet-tooltip-left.neumorphic-tooltip::before,
        .leaflet-tooltip-right.neumorphic-tooltip::before {
          border-top-color: hsl(var(--border));
        }
        .leaflet-bar a, .leaflet-bar a:hover {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
            border-bottom: 1px solid hsl(var(--border));
            box-shadow: 3px 3px 6px hsl(var(--background) / 0.6), -3px -3px 6px #ffffff;
        }
        .leaflet-bar a:active {
            box-shadow: inset 3px 3px 6px hsl(var(--background) / 0.6), inset -3px -3px 6px #ffffff;
        }
        .leaflet-draw-toolbar {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .leaflet-draw-toolbar a {
            box-shadow: 3px 3px 6px hsl(var(--background) / 0.6), -3px -3px 6px #ffffff !important;
            border-radius: 0.5rem !important;
            border: 1px solid transparent;
        }
        .leaflet-draw-toolbar a:hover {
            border-color: hsl(var(--border));
        }
        .leaflet-draw-actions {
            box-shadow: 3px 3px 6px hsl(var(--background) / 0.6), -3px -3px 6px #ffffff;
            border-radius: 0.5rem;
        }
        .leaflet-draw-actions a {
            color: hsl(var(--foreground));
        }
      `}</style>
      
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

      <div className="absolute bottom-12 right-2 z-10 flex flex-col gap-2">
         <Button
          variant="secondary"
          size="icon"
          onClick={() => setMapStyle(style => {
            const styles: MapStyle[] = ['street', 'satellite', 'dark'];
            const currentIndex = styles.indexOf(style);
            return styles[(currentIndex + 1) % styles.length];
          })}
          title="Kartenstil wechseln"
          className="rounded-full"
        >
          <Globe className="h-5 w-5" />
        </Button>
        <Button
            variant="secondary"
            size="icon"
            onClick={handleRecenter}
            title="Auf Einheiten zentrieren"
            className="rounded-full"
        >
            <Target className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
