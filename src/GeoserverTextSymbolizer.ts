import { TextSymbolizer } from 'geostyler-style';

interface GeoserverTextSymbolizer extends TextSymbolizer {
  spaceAround?: number;
  partials?: boolean;
  repeat?: number;
  autoWrap?: number;
  maxDisplacements?: number;
  group?: string;
  conflictResolution?: boolean;
  goodnessOfFit?: number;
  labelAllGroup?: boolean;
  polygonAlign?: string;
}

export default GeoserverTextSymbolizer;
