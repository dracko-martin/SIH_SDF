import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Helper Components ---

// New, compact sidebar
const Sidebar = ({ activeTab, setActiveTab }) => (
    <aside className="w-20 bg-gray-100 dark:bg-gray-900 p-2 flex flex-col items-center space-y-4">
        <div className="p-2 rounded-lg bg-blue-500 dark:bg-blue-600 text-white">
            <FishIcon size={28} />
        </div>
        <nav className="flex flex-col space-y-2">
            <SidebarTab
                icon={<GlobeHemisphereWestIcon size={24} />}
                text="HOME"
                active={activeTab === 'map'}
                onClick={() => setActiveTab('map')}
            />
            <SidebarTab
                icon={<LayoutDashboardIcon size={24} />}
                text="Dashboard"
                active={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
            />
        </nav>
    </aside>
);

const SidebarTab = ({ icon, text, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors duration-200 ${
            active
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={text}
    >
        {icon}
        <span className="text-xs mt-1">{text.split(' ')[0]}</span>
    </button>
);


// Header with Dark Mode Toggle
const Header = ({ theme, toggleTheme }) => (
    <header className="bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between p-4 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Project SDF</h1>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {theme === 'dark' ? <SunIcon className="text-yellow-400" /> : <MoonIcon className="text-gray-700" />}
        </button>
    </header>
);

// Species Dropdown Selector
const SpeciesSelector = ({ onSpeciesSelect }) => {
    const [speciesNames, setSpeciesNames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNames() {
            try {
                const response = await fetch('http://127.0.0.1:8000/analytics/species-names/');
                if (!response.ok) throw new Error('Failed to fetch species names');
                const data = await response.json();
                setSpeciesNames(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchNames();
    }, []);

    return (
        <div className="mb-6">
            <label htmlFor="species-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select a Species to Display
            </label>
            <select
                id="species-select"
                disabled={loading}
                onChange={(e) => onSpeciesSelect(e.target.value)}
                className="block w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">{loading ? 'Loading names...' : '-- Select a Species --'}</option>
                {speciesNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                ))}
            </select>
        </div>
    );
};

// Component to display details of the selected species
const SpeciesDetails = ({ details }) => {
    if (!details) {
        return (
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Select a species to see its details and locations on the map.</p>
            </div>
        );
    }

    const { country, locality, event_date, organism_quantity, basis_of_record } = details;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-fade-in">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Latest Sighting Details</h3>
             <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong className="text-gray-600 dark:text-gray-400">Country:</strong> {country || 'N/A'}</p>
                <p><strong className="text-gray-600 dark:text-gray-400">Locality:</strong> {locality || 'N/A'}</p>
                <p><strong className="text-gray-600 dark:text-gray-400">Date:</strong> {event_date ? new Date(event_date).toLocaleDateString() : 'N/A'}</p>
                <p><strong className="text-gray-600 dark:text-gray-400">Quantity:</strong> {organism_quantity ?? 'N/A'}</p>
                <p className="col-span-2"><strong className="text-gray-600 dark:text-gray-400">Basis of Record:</strong> {basis_of_record || 'N/A'}</p>
             </div>
        </div>
    );
};


// Leaflet Map Component
const MapView = ({ locations }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const layerGroup = useRef(null);

    useEffect(() => {
        // Load leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        // Load leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
             if (mapRef.current && !mapInstance.current) {
                mapInstance.current = window.L.map(mapRef.current).setView([20, 85], 5); // Default view
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstance.current);
                layerGroup.current = window.L.layerGroup().addTo(mapInstance.current);
             }
        };
        document.body.appendChild(script);

        return () => {
            document.head.removeChild(link);
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        if (mapInstance.current && layerGroup.current && window.L) {
            // Clear previous markers
            layerGroup.current.clearLayers();

            if (locations && locations.length > 0) {
                const markers = [];
                locations.forEach(loc => {
                    if (loc.decimal_latitude && loc.decimal_longitude) {
                        const marker = window.L.marker([loc.decimal_latitude, loc.decimal_longitude])
                            .bindPopup(`<b>${loc.scientific_name}</b><br>Locality: ${loc.locality || 'N/A'}<br>Date: ${new Date(loc.event_date).toLocaleDateString()}`);
                        layerGroup.current.addLayer(marker);
                        markers.push(marker);
                    }
                });
                // Fit map to markers
                 if (markers.length > 0) {
                    const group = new window.L.featureGroup(markers);
                    mapInstance.current.fitBounds(group.getBounds().pad(0.1));
                }
            } else {
                 // Reset view if no locations
                 mapInstance.current.setView([20, 85], 5);
            }
        }
    }, [locations]);

    return <div ref={mapRef} className="w-full h-full rounded-lg shadow-md z-10" />;
};


// --- Main Application Component ---
const App = () => {
    const [theme, setTheme] = useState('light');
    const [activeTab, setActiveTab] = useState('map');
    const [selectedSpecies, setSelectedSpecies] = useState(null);
    const [speciesData, setSpeciesData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Theme toggle logic
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // Data fetching for selected species
    const handleSpeciesSelect = useCallback(async (speciesName) => {
        setSelectedSpecies(speciesName);
        if (!speciesName) {
            setSpeciesData([]);
            return;
        }
        setLoading(true);
        try {
            // Encode the species name to handle special characters in URLs
            const encodedName = encodeURIComponent(speciesName);
            const response = await fetch(`http://127.0.0.1:8000/analytics/species/?scientific_name=${encodedName}`);
            if (!response.ok) throw new Error('Failed to fetch species data');
            const data = await response.json();
            // We only need the results array
            setSpeciesData(data.results || []);
        } catch (error) {
            console.error(error);
            setSpeciesData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header theme={theme} toggleTheme={toggleTheme} />
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        <div className="lg:col-span-1 flex flex-col space-y-6">
                            <SpeciesSelector onSpeciesSelect={handleSpeciesSelect} />
                            {loading ? <div className="text-center">Loading details...</div> : <SpeciesDetails details={speciesData[0]} />}
                        </div>
                        <div className="lg:col-span-2 h-[50vh] lg:h-full">
                             <MapView locations={speciesData} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- SVG Icons ---
const FishIcon = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 12.5C6.5 12.5 2 13 2 17C2 21 6.5 21.5 6.5 21.5M17.5 12.5C17.5 12.5 22 13 22 17C22 21 17.5 21.5 17.5 21.5M18 12.5C18 10 16 3 12 3C8 3 6 10 6 12.5C6 14.5 8 16 12 16C16 16 18 14.5 18 12.5Z"></path></svg>;
const GlobeHemisphereWestIcon = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>;
const LayoutDashboardIcon = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const SunIcon = ({className}) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = ({className}) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;

export default App;

