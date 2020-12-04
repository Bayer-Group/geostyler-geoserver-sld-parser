import SldStyleParser from 'geostyler-sld-parser';
import {
  Filter,
  ComparisonFilter, BaseSymbolizer,
} from 'geostyler-style';
import GeoserverFillSymbolizer from './GeoserverFillSymbolizer';
import GeoserverTextSymbolizer from './GeoserverTextSymbolizer';

const VENDOR_OPTIONS_MAP = [
  'partials',
  'repeat',
  'autoWrap',
  'maxDisplacements',
  'group',
  'spaceAround',
  'conflictResolution',
  'goodnessOfFit',
  'labelAllGroup',
  'polygonAlign',
  'graphicMargin'
];

function keysByValue (object: any, value: any) {
  return Object.keys(object).filter(key => object[key] === value);
}

class GeoserverSldStyleParser extends SldStyleParser {
  // reading SLD string and return object
  getTextSymbolizerFromSldSymbolizer(sldSymbolizer: any): GeoserverTextSymbolizer {
    const finalSymbolizer = super.getTextSymbolizerFromSldSymbolizer(sldSymbolizer) as GeoserverTextSymbolizer;

    // if there are vendor options, parse them and assign to the final symbolizer
    this.assignVendorOptions_(sldSymbolizer, finalSymbolizer);

    finalSymbolizer.LabelPlacement = sldSymbolizer.LabelPlacement;

    return finalSymbolizer;
  }

  // write to xml2js compatible output format (which converts to a string..eventually)
  getSldTextSymbolizerFromTextSymbolizer(textSymbolizer: GeoserverTextSymbolizer): any {
    const finalSymbolizer = super.getSldTextSymbolizerFromTextSymbolizer(textSymbolizer);
    const vendorOption = this.writeVendorOption_(textSymbolizer);

    finalSymbolizer.TextSymbolizer[0].VendorOption = vendorOption;

    finalSymbolizer.TextSymbolizer[0].LabelPlacement = textSymbolizer.LabelPlacement;

    return finalSymbolizer;
  }

  getFillSymbolizerFromSldSymbolizer(sldSymbolizer: any): GeoserverFillSymbolizer {
    const finalSymbolizer = super.getFillSymbolizerFromSldSymbolizer(sldSymbolizer) as GeoserverFillSymbolizer;
    this.assignVendorOptions_(sldSymbolizer, finalSymbolizer);
    return finalSymbolizer;
  }

  getSldPolygonSymbolizerFromFillSymbolizer(fillSymbolizer: GeoserverFillSymbolizer): any {
    const finalSymbolizer = super.getSldPolygonSymbolizerFromFillSymbolizer(fillSymbolizer);
    const vendorOption = this.writeVendorOption_(fillSymbolizer);
    finalSymbolizer.PolygonSymbolizer[0].VendorOption = vendorOption;
    return finalSymbolizer;
  }

  getSldComparisonFilterFromComparisonFilter(comparisonFilter: ComparisonFilter): any {
    const sldComparisonFilter = super.getSldComparisonFilterFromComparisonFilter(comparisonFilter);
    const operator = comparisonFilter[0];
    const value = comparisonFilter[2];
    const sldOperators: string[] = keysByValue(SldStyleParser.comparisonMap, operator);
    let sldOperator: string = (sldOperators.length > 1 && value === null)
      ? sldOperators[1] : sldOperators[0];

    if (sldOperator === 'PropertyIsLike' && comparisonFilter[3]) {
      return {
        ...sldComparisonFilter,
        [sldOperator]: sldComparisonFilter[sldOperator].map((filter: any) => ({ ...filter, '$': comparisonFilter[3] }))
      };
    } else {
      return sldComparisonFilter;
    }
  }

  getFilterFromOperatorAndComparison(sldOperatorName: string, sldFilter: any): Filter {
    const filter = super.getFilterFromOperatorAndComparison(sldOperatorName, sldFilter);
    const isComparison = Object.keys(SldStyleParser.comparisonMap).includes(sldOperatorName);

    if (isComparison && sldOperatorName === 'PropertyIsLike') {
      filter.push(sldFilter.$);
    }

    return filter;
  }

  writeVendorOption_(symbolizer: BaseSymbolizer) {
    return Object.keys(symbolizer).filter(
      (propertyName: string) => VENDOR_OPTIONS_MAP.includes(propertyName))
      .map((propertyName: string) => {
        return {
          '_': symbolizer[propertyName],
          '$': { name: propertyName }
        };
      });
  }

  assignVendorOptions_(sldSymbolizer: any, finalSymbolizer: BaseSymbolizer): void {
    if (Array.isArray(sldSymbolizer.VendorOption)) {
      const assignOption = (option: any) => {
        const {$: {name}, _: value} = option;
        finalSymbolizer[name] = value;
      };
      sldSymbolizer.VendorOption.forEach(assignOption);
    }
  }
}

export default GeoserverSldStyleParser;
