'use client';
// CSS must be imported first
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import * as React from 'react';
import L, { type Map } from 'leaflet';
import 'leaflet-draw';

import type { MeshUnit, UnitStatus, UnitType } from '@/types/mesh';
import { Globe, Map as MapIcon, Target, Flame, Droplets, Star, ParkingCircle, TriangleAlert, Wind, Network } from 'lucide-react';
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
  'fire-source': { icon: Flame, tooltip: 'Brandherd', color: 'text-orange-400' },
  'water-source': { icon: Droplets, tooltip: 'Wasserentnahmestelle', color: 'text-cyan-400' },
  'command-post': { icon: Star, tooltip: 'Einsatzleitung', color: 'text-yellow-400' },
  'staging-area': { icon: ParkingCircle, tooltip: 'Bereitstellungsraum', color: 'text-gray-400' },
  'danger-zone': { icon: TriangleAlert, tooltip: 'Gefahrenbereich', color: 'text-red-500' },
  'wind-direction': { icon: Wind, tooltip: 'Windrichtung', color: 'text-sky-400' },
};

const FIRE_DEPARTMENT_SYMBOLS: Record<number, { name: string; svgPath: string; viewBox?: string }> = {
  1: { // HLF-20 (Fire Engine with ladder symbol)
    name: "HLF-20",
    svgPath: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1h2M7 17v-4h4m1.5-6l-3 3h6l-3-3M7 15a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"
  },
  3: { // ELW-1 (Command Vehicle with antenna)
    name: "ELW-1",
    svgPath: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1h2M12 7l1-2 1 2m-1-2V2m-5 13v-4h4m3 2a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"
  },
  5: { // DLK-23 (Ladder Truck with extended ladder)
    name: "DLK-23",
    svgPath: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1h2m3-10L2 14M5 17v-4h4m3 2a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"
  },
  6: { // RTW (Ambulance with cross)
    name: "RTW",
    svgPath: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1h2m3-8h4m-2-2v4M5 17v-4h4m3 2a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"
  },
  7: { // NEF (Doctor's Car)
    name: "NEF",
    svgPath: "M14 17H4c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h1l1-2h4l1 2h3c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2zM12 9H9.5a1.5 1.5 0 0 0 0 3H12l-2 3 2 3h.5a1.5 1.5 0 0 0 0-3H12l2-3-2-3z M5 15a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"
  },
  8: { // MTF (Troop Transport, van/bus)
    name: "MTF",
    svgPath: "M19 17h2c.6 0 1-.4 1-1v-4c0-.9-.7-1.7-1.5-1.9C18.7 9.6 16 9 16 9H4c-.9 0-1.7.7-1.9 1.5S3 12 3 12v4c0 .6.4 1 1 1h2M5 17v-5h14v5M7 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"
  },
  10: { // Einsatzleiter (Commander, person with star)
    name: "Einsatzleiter",
    svgPath: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2m7-14l-2 4h4l-2-4z"
  }
};


const createSymbolIcon = (symbolKey: string) => {
    const symbol = TACTICAL_SYMBOLS[symbolKey];
    if (!symbol) return new L.Icon.Default();
    
    const iconHtml = `
        <div class="bg-black/40 border border-white/20 rounded-md p-1 w-8 h-8 flex items-center justify-center backdrop-blur-sm">
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
  Online: 'hsl(var(--accent))',
  Moving: 'hsl(142 71% 45%)', // green-500
  Idle: 'hsl(215 91% 60%)', // blue-500
  Alarm: 'hsl(0 84% 60%)', // red-500
  Offline: 'hsl(215 20% 65%)', // muted-foreground
  Maintenance: 'hsl(25 95% 53%)', // orange-500
};

const createUnitIcon = (unit: MeshUnit, isHighlighted: boolean) => {
  const color = STATUS_COLORS[unit.status] || 'hsl(215 20% 65%)';
  const alarmAnimationClass = unit.status === 'Alarm' ? 'animate-ping' : '';
  const highlightScale = isHighlighted ? 'scale-110' : 'scale-100';
  
  const customSymbol = FIRE_DEPARTMENT_SYMBOLS[unit.id];

  const typeIcons: Record<string, string> = {
    Vehicle: `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1h2"/><path d="M14 17h-4"/><path d="M15 7h-5"/><path d="M5 17v-4h4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>`,
    Personnel: `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  };
  const genericIconPath = `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" x2="12" y1="22.08" y2="12" />`;

  const iconPath = customSymbol?.svgPath || typeIcons[unit.type] || genericIconPath;
  const viewBox = customSymbol?.viewBox || "0 0 24 24";

  const iconHtml = `
    <div class="relative flex items-center justify-center transition-transform duration-200 ${highlightScale}">
      <div 
        class="absolute -inset-1 rounded-full ${alarmAnimationClass}"
        style="background: ${color}; animation-duration: 1.5s; opacity: 0.8; filter: blur(12px);"
      ></div>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" class="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          <circle cx="18" cy="18" r="17" fill="hsl(var(--card) / 0.5)" stroke="${color}" stroke-width="1.5"/>
          <svg x="6" y="6" width="24" height="24" viewBox="${viewBox}" stroke-width="2" stroke="hsl(var(--card-foreground))" fill="none" stroke-linecap="round" stroke-linejoin="round">
              ${iconPath}
          </svg>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const createControlCenterIcon = () => {
  const color = 'hsl(var(--primary))'; 
  
  const iconHtml = `
    <div class="relative flex items-center justify-center">
        <div class="absolute inset-0 rounded-full" style="background: ${color}; filter: blur(16px); opacity: 0.8;"></div>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <circle cx="22" cy="22" r="21" fill="hsl(var(--card) / 0.6)" stroke="${color}" stroke-width="2"/>
            <path d="M22 17L24.32 21.8L29.5 22.5L25.75 26.1L26.64 31L22 28.4L17.36 31L18.25 26.1L14.5 22.5L19.68 21.8L22 17Z" fill="${color}"/>
        </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};


const TacticalToolbar = ({ onSelect, selectedSymbol }: { onSelect: (key: string | null) => void, selectedSymbol: string | null }) => (
  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 p-1 bg-card/50 backdrop-blur-sm rounded-full border">
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
  const meshLinesLayerRef = React.useRef<L.FeatureGroup | null>(null);
  const markersRef = React.useRef<Record<number, L.Marker>>({});
  const controlCenterMarkerRef = React.useRef<L.Marker | null>(null);
  const isInitiallyCenteredRef = React.useRef(false);
  
  const [mapStyle, setMapStyle] = React.useState<MapStyle>('dark');
  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);
  const [showMeshConnections, setShowMeshConnections] = React.useState(false);


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

      tileLayerRef.current = L.tileLayer(TILE_LAYERS.dark.url, {
          attribution: TILE_LAYERS.dark.attribution,
      }).addTo(map);

      editableLayersRef.current = new L.FeatureGroup().addTo(map);
      meshLinesLayerRef.current = new L.FeatureGroup().addTo(map);

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
              shapeOptions: { color: 'hsl(var(--primary))', fillOpacity: 0.1 },
            },
            polyline: { shapeOptions: { color: 'hsl(var(--primary))', weight: 3 } },
            rectangle: { shapeOptions: { color: 'hsl(var(--primary))', fillOpacity: 0.1 } },
            circle: { shapeOptions: { color: 'hsl(var(--primary))', fillOpacity: 0.1 } },
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
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'street';
      if (tileLayerRef.current && mapInstanceRef.current) {
          tileLayerRef.current.setUrl(TILE_LAYERS[currentTheme].url);
          tileLayerRef.current.options.attribution = TILE_LAYERS[currentTheme].attribution;
      }
  }, [mapStyle]); // Re-run when mapStyle changes (which we can trigger from theme toggle)


  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'street';
      setMapStyle(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

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
        const icon = createUnitIcon(unit, isHighlighted);
        
        const marker = L.marker(position, { icon })
          .addTo(map)
          .bindTooltip(tooltipContent, {
            className: 'glass-tooltip',
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
          .bindTooltip(tooltipContent, { className: 'glass-tooltip' }).addTo(map);

        controlCenterMarkerRef.current = marker;
    }
  }, [units, highlightedUnitId, controlCenterPosition, onUnitClick]);

  // Draw mesh connection lines
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const meshLinesLayer = meshLinesLayerRef.current;
    if (!map || !meshLinesLayer) return;

    meshLinesLayer.clearLayers();

    if (!showMeshConnections) {
        return;
    }

    const activeUnits = units.filter(u => u.isActive);
    if (activeUnits.length < 2) return;

    // Group units by hop count for easier lookup
    const unitsByHop: Record<number, MeshUnit[]> = {};
    activeUnits.forEach(unit => {
        if (!unitsByHop[unit.hopCount]) {
            unitsByHop[unit.hopCount] = [];
        }
        unitsByHop[unit.hopCount].push(unit);
    });

    activeUnits.forEach(unit => {
        if (unit.hopCount <= 0) return;

        let parentPosition: { lat: number, lng: number } | null = null;

        if (unit.hopCount === 1) {
            // Units with hopCount 1 connect to the control center
            if (controlCenterPosition) {
                parentPosition = controlCenterPosition;
            }
        } else {
            // Units with hopCount > 1 connect to a unit with hopCount - 1
            const potentialParents = unitsByHop[unit.hopCount - 1];
            if (potentialParents && potentialParents.length > 0) {
                // Find the closest parent
                let closestParent: MeshUnit | null = null;
                let minDistance = Infinity;

                potentialParents.forEach(parent => {
                    const distance = L.latLng(unit.position.lat, unit.position.lng).distanceTo(
                        L.latLng(parent.position.lat, parent.position.lng)
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestParent = parent;
                    }
                });
                
                if (closestParent) {
                    parentPosition = closestParent.position;
                }
            }
        }

        if (parentPosition) {
             const line = L.polyline(
                [
                    [unit.position.lat, unit.position.lng],
                    [parentPosition.lat, parentPosition.lng]
                ],
                {
                    color: 'hsl(var(--accent))',
                    weight: 1.5,
                    opacity: 0.6,
                    dashArray: '5, 10',
                }
            ).addTo(meshLinesLayer);

            // Add a glow effect using a second, thicker, more transparent line
            L.polyline(
                [
                    [unit.position.lat, unit.position.lng],
                    [parentPosition.lat, parentPosition.lng]
                ],
                {
                    color: 'hsl(var(--accent))',
                    weight: 5,
                    opacity: 0.1,
                }
            ).addTo(meshLinesLayer);
        }
    });
  }, [units, showMeshConnections, controlCenterPosition]);

  // Perform initial centering only once
  React.useEffect(() => {
    if (!isInitiallyCenteredRef.current && (units.some(u => u.isActive) || controlCenterPosition)) {
      handleRecenter();
      isInitiallyCenteredRef.current = true;
    }
  }, [units, controlCenterPosition, handleRecenter]);


  return (
    <div className="relative w-full h-full overflow-hidden border-t bg-background/20 backdrop-blur-lg">
      <style>{`
        .leaflet-tooltip.glass-tooltip {
          background-color: hsl(var(--popover) / 0.7);
          border: 1px solid hsl(var(--border));
          color: hsl(var(--popover-foreground));
          border-radius: var(--radius);
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        }
        .leaflet-tooltip-top.glass-tooltip::before,
        .leaflet-tooltip-bottom.glass-tooltip::before,
        .leaflet-tooltip-left.glass-tooltip::before,
        .leaflet-tooltip-right.glass-tooltip::before {
          border-top-color: hsl(var(--border));
        }
        .leaflet-bar a, .leaflet-bar a:hover {
            background-color: hsl(var(--card) / 0.7);
            color: hsl(var(--foreground));
            border: 1px solid hsl(var(--border) / 0.5);
            backdrop-filter: blur(8px);
        }
        .leaflet-draw-toolbar {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .leaflet-draw-toolbar a {
            border-radius: 0.5rem !important;
            border: 1px solid hsl(var(--border) / 0.5);
        }
         .leaflet-draw-actions a {
            color: hsl(var(--foreground));
        }
      `}</style>
      
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

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
         <Button
          variant="outline"
          size="icon"
          onClick={() => {
              const newStyle = mapStyle === 'dark' || mapStyle === 'street' ? 'satellite' : document.documentElement.classList.contains('dark') ? 'dark' : 'street';
              setMapStyle(newStyle);
            }
          }
          title="Kartenstil wechseln"
          className="rounded-full"
        >
          <Globe className="h-5 w-5" />
        </Button>
        <Button
            variant="outline"
            size="icon"
            onClick={handleRecenter}
            title="Auf Einheiten zentrieren"
            className="rounded-full"
        >
            <Target className="h-5 w-5" />
        </Button>
        <Button
            variant={showMeshConnections ? 'secondary' : 'outline'}
            size="icon"
            onClick={() => setShowMeshConnections(prev => !prev)}
            title="Mesh-Verbindungen umschalten"
            className="rounded-full"
        >
            <Network className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
