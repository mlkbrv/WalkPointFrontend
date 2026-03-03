import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { Clock, Flame, Footprints, MapPin, MoreVertical } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useApp } from '../context/AppContext';
import { calculateRouteDistance } from '../utils/calculations';

const { width, height } = Dimensions.get('window');

export default function TrackScreen() {
  const {
    dailyStats,
    currentRoute,
    isTrackingRoute,
    setCurrentRoute,
    setIsTrackingRoute,
    addTrackingSession,
    startStepTracking,
  } = useApp();

  useFocusEffect(
    useCallback(() => {
      startStepTracking();
    }, [startStepTracking])
  );

  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const subscriptionRef = useRef(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for tracking.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    let subscription = null;
    
    if (isTrackingRoute) {
      (async () => {
        try {
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 3000, // Update every 3 seconds for smoother tracking
              distanceInterval: 3, // Update every 3 meters for smoother polyline
            },
            (newLocation) => {
              setLocation(newLocation);
              const newCoord = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              };
              setRouteCoordinates((prev) => [...prev, newCoord]);
              
              // Update map with new location
              if (webViewRef.current && newLocation) {
                const lat = newLocation.coords.latitude;
                const lng = newLocation.coords.longitude;
                const script = `
                  if (window.map && window.marker) {
                    window.marker.setLatLng([${lat}, ${lng}]);
                    window.map.setView([${lat}, ${lng}], 16);
                  }
                `;
                webViewRef.current.injectJavaScript(script);
              }
            }
          );
          subscriptionRef.current = subscription;
        } catch (error) {
          console.error('Location tracking error:', error);
        }
      })();
    }

    return () => {
      if (subscriptionRef.current && typeof subscriptionRef.current.remove === 'function') {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [isTrackingRoute]);

  const startTracking = () => {
    setRouteCoordinates([]);
    setTrackingStartTime(new Date());
    setIsTrackingRoute(true);
    setCurrentRoute([]);
  };

  const stopTracking = () => {
    if (subscriptionRef.current && typeof subscriptionRef.current.remove === 'function') {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTrackingRoute(false);
    if (routeCoordinates.length > 0 && trackingStartTime) {
      const duration = Math.floor((new Date() - trackingStartTime) / 1000 / 60);
      // Calculate route distance using Haversine formula
      const routeDistance = calculateRouteDistance(routeCoordinates);
      const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        steps: dailyStats.steps,
        time: duration,
        calories: dailyStats.calories,
        distance: routeDistance > 0 ? routeDistance : dailyStats.distance, // Use GPS distance if available
        route: routeCoordinates,
      };
      addTrackingSession(session);
      setCurrentRoute(routeCoordinates);
      
      // Draw route on map
      if (webViewRef.current && routeCoordinates.length > 0) {
        const routePoints = routeCoordinates.map(c => `[${c.latitude}, ${c.longitude}]`).join(', ');
        const script = `
          if (window.map && window.routeLayer) {
            window.routeLayer.remove();
          }
          if (window.map) {
            window.routeLayer = L.polyline([${routePoints}], {
              color: '#8140F3',
              weight: 4,
              opacity: 0.8
            }).addTo(window.map);
            window.map.fitBounds(window.routeLayer.getBounds());
          }
        `;
        webViewRef.current.injectJavaScript(script);
      }
    }
  };

  const handleStopPress = () => {
    if (isTrackingRoute) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Generate HTML for map with Leaflet.js
  const getMapHTML = () => {
    const lat = location?.coords?.latitude || 40.7128;
    const lng = location?.coords?.longitude || -74.0060;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            * { margin: 0; padding: 0; }
            body, html { width: 100%; height: 100%; overflow: hidden; }
            #map { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            window.map = L.map('map').setView([${lat}, ${lng}], 16);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(window.map);
            
            window.marker = L.marker([${lat}, ${lng}], {
              icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                shadowSize: [41, 41]
              })
            }).addTo(window.map);
            
            window.marker.bindPopup('Your Location').openPopup();
            
            window.routeLayer = null;
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Footprints size={24} color="#8140F3" />
        </View>
        <Text style={styles.headerTitle}>Track</Text>
        <Pressable style={styles.menuButton}>
          <MoreVertical size={20} color="#000000" />
        </Pressable>
      </View>

      {/* Real Map with OpenStreetMap */}
      <View style={styles.mapContainer}>
        {location ? (
          <WebView
            ref={webViewRef}
            source={{ html: getMapHTML() }}
            style={styles.map}
            scrollEnabled={true}
            zoomEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onMessage={(event) => {
              console.log('Map message:', event.nativeEvent.data);
            }}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>📍</Text>
            <Text style={styles.mapPlaceholderLabel}>Getting your location...</Text>
          </View>
        )}
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Footprints size={28} color="#2196F3" strokeWidth={2} />
          <Text style={styles.statValue}>{dailyStats.steps.toLocaleString()}</Text>
          <Text style={styles.statLabel}>steps</Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={28} color="#FF9800" strokeWidth={2} />
          <Text style={styles.statValue}>
            {Math.floor(dailyStats.time / 60)}h {dailyStats.time % 60}m
          </Text>
          <Text style={styles.statLabel}>time</Text>
        </View>
        <View style={styles.statItem}>
          <Flame size={28} color="#F44336" strokeWidth={2} />
          <Text style={styles.statValue}>{dailyStats.calories}</Text>
          <Text style={styles.statLabel}>kcal</Text>
        </View>
        <View style={styles.statItem}>
          <MapPin size={28} color="#4CAF50" strokeWidth={2} />
          <Text style={styles.statValue}>{dailyStats.distance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
      </View>

      {/* Stop Button */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.stopButton, isTrackingRoute && styles.stopButtonActive]}
          onPress={handleStopPress}
        >
          <Text style={styles.stopButtonText}>
            {isTrackingRoute ? 'Stop' : 'Start Tracking'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#F8F9FB',
  },
  logoContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  mapPlaceholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  mapPlaceholderLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  stopButton: {
    backgroundColor: '#8140F3',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#8140F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  stopButtonActive: {
    backgroundColor: '#F44336',
    shadowColor: '#F44336',
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
