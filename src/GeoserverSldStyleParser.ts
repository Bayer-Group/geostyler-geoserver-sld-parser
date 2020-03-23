import SldStyleParser from 'geostyler-sld-parser';
import {
  Filter,
  ComparisonFilter
} from 'geostyler-style';
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
  'polygonAlign'
]

function keysByValue (object: any, value: any) {
  return Object.keys(object).filter(key => object[key] === value);
}

class GeoserverSldStyleParser extends SldStyleParser {
  // reading SLD string and return object
  getTextSymbolizerFromSldSymbolizer(sldSymbolizer: any): GeoserverTextSymbolizer {
    const finalSymbolizer = super.getTextSymbolizerFromSldSymbolizer(sldSymbolizer)

    // if there are vendor options, parse them and assign to the final symbolizer
    if (Array.isArray(sldSymbolizer.VendorOption)) {
      const assignOption = (option: any) => {
        const { $: { name }, _: value } = option;

        finalSymbolizer[name] = value;
      }

      sldSymbolizer.VendorOption.forEach(assignOption);
    }

    finalSymbolizer['LabelPlacement'] = sldSymbolizer.LabelPlacement;

    return finalSymbolizer;
  }

  // write to xml2js compatible output format (which converts to a string..eventually)
  getSldTextSymbolizerFromTextSymbolizer(textSymbolizer: GeoserverTextSymbolizer): any {
    const finalSymbolizer = super.getSldTextSymbolizerFromTextSymbolizer(textSymbolizer);

    const vendorOption = Object.keys(textSymbolizer).filter((propertyName: string) => VENDOR_OPTIONS_MAP.includes(propertyName))
      .map((propertyName: string) => {
        return {
          '_': textSymbolizer[propertyName],
          '$': { name: propertyName }
        }
    });

    finalSymbolizer.TextSymbolizer[0].VendorOption = vendorOption;

    finalSymbolizer.TextSymbolizer[0].LabelPlacement = textSymbolizer.LabelPlacement;

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
}

export default GeoserverSldStyleParser;
