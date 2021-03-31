import { BasePointSymbolizer, WellKnownName } from 'geostyler-style';

/**
 * MarkSymbolizer describes the style representation of POINT data, if styled as
 * with a regular geometry.
 */
interface GeoserverMarkSymbolizer extends BasePointSymbolizer {
  kind: 'Mark';
  /**
   * The WellKnownName of the MarkSymbolizer.
   */
  wellKnownName: WellKnownName;
  /**
   * The radius of the Symbolizer. Values describing the full size of the Symbolizer
   * have to be divided by two.
   */
  radius?: number;
  /**
   * The rotation of the Symbolizer in degrees. Value should be between 0 and 360.
   */
  rotate?: number;
  /**
   * The opacity of the fill. A value between 0 and 1.
   * 0 is none opaque and 1 is full opaque.
   */
  fillOpacity?: number;
  /**
   * The color of the stroke represented as a hex-color string.
   */
  strokeColor?: string;
  /**
   * The opacity of the stroke. A value between 0 and 1.
   * 0 is none opaque and 1 is full opaque.
   */
  strokeOpacity?: number;
  /**
   * The width of the stroke in pixels.
   */
  strokeWidth?: number;
  /**
   * Amount to blur the Symbolizer. 1 blurs the Symbolizer such that only the
   * centerpoint has full opacity. Mostly relevant for circles.
   */
  blur?: number;
  /**
   * Property relevant for mapbox-styles.
   * Compare https://docs.mapbox.com/mapbox-gl-js/style-spec/#paint-circle-circle-pitch-alignment
   */
  pitchAlignment?: 'map' | 'viewport';
  /**
   * Property relevant for mapbox-styles.
   * Compare https://docs.mapbox.com/mapbox-gl-js/style-spec/#paint-circle-circle-pitch-scale
   */
  pitchScale?: 'map' | 'viewport';
}

export default GeoserverMarkSymbolizer
