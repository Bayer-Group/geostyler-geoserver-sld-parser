import SldStyleParser from 'geostyler-sld-parser';
import { WellKnownName } from 'geostyler-style';
import GeoserverTextSymbolizer from './GeoserverTextSymbolizer';
import GeoserverMarkSymbolizer from './GeoserverMarkSymbolizer';
import GeoserverFillSymbolizer from './GeoserverFillSymbolizer';
import {
  Filter,
  ComparisonFilter, BaseSymbolizer,
} from 'geostyler-style';
const _get = require('lodash.get');
type CssParam  = {
  '_': string | number,
  '$': {
    name: string
  };
};
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
  'graphic-margin'
];

function keysByValue (object: any, value: any) {
  return Object.keys(object).filter(key => object[key] === value);
}

const WELLKNOWNNAME_TTF_REGEXP = /^ttf:\/\/(.+)#(.+)$/;

class GeoserverSldStyleParser extends SldStyleParser {
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

      return filter;
    } else {
      return filter;
    }
  }

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

  /**
   * Get the GeoStyler-Style MarkSymbolizer from an SLD Symbolizer
   *
   * @param {object} sldSymbolizer The SLD Symbolizer
   * @return {MarkSymbolizer} The GeoStyler-Style MarkSymbolizer
   */
  getMarkSymbolizerFromSldSymbolizer(sldSymbolizer: any): GeoserverMarkSymbolizer {
    const wellKnownName: string = _get(sldSymbolizer, 'Graphic[0].Mark[0].WellKnownName[0]');
    let strokeParams: any[] = _get(sldSymbolizer, 'Graphic[0].Mark[0].Stroke[0].CssParameter') || [];
    if (strokeParams.length === 0) {
      strokeParams = _get(sldSymbolizer, 'Graphic[0].Mark[0].Stroke[0].SvgParameter') || [];
    }
    const opacity: string = _get(sldSymbolizer, 'Graphic[0].Opacity[0]');
    const size: string = _get(sldSymbolizer, 'Graphic[0].Size[0]');
    const rotation: string = _get(sldSymbolizer, 'Graphic[0].Rotation[0]');

    let fillParams: any[] = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].CssParameter') || [];
    if (fillParams.length === 0) {
      fillParams = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].SvgParameter') || [];
    }
    const colorIdx: number = fillParams.findIndex((cssParam: any) => {
      return cssParam.$.name === 'fill';
    });
    let color: string = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].CssParameter[' + colorIdx + ']._');
    if (!color) {
      const svg = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].SvgParameter[' + colorIdx + ']._');
      if (svg) {
        color = svg;
      }
    }

    const sldFunction = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].CssParameter[' + colorIdx + '].Function');

    const fillOpacityIdx: number = fillParams.findIndex((cssParam: any) => {
      return cssParam.$.name === 'fill-opacity';
    });
    let fillOpacity: string = _get(sldSymbolizer,
                                   'Graphic[0].Mark[0].Fill[0].CssParameter[' + fillOpacityIdx + ']._');
    if (!fillOpacity) {
      fillOpacity = _get(sldSymbolizer,
                         'Graphic[0].Mark[0].Fill[0].SvgParameter[' + fillOpacityIdx + ']._');
    }
    const markSymbolizer: GeoserverMarkSymbolizer = {
      kind: 'Mark',
    } as GeoserverMarkSymbolizer;

    if (sldFunction) {
      if (sldFunction[0].$.name === 'Interpolate') {
        const perChunk = 2; // items per chunk

        var newArray = sldFunction[0].Literal.reduce((resultArray: any, item: any, index: any) => { 
          const chunkIndex = Math.floor(index / perChunk);

          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // start a new chunk
          }
          resultArray[chunkIndex].push(item);

          return resultArray;
        },                                           []);

        const newestArray = newArray.map((arr: any, i: any) => {
          return [i === 0 ? '>' : '<', sldFunction[0].PropertyName[0], ...arr];
        });

        const functionArray = [
          sldFunction[0].$.name,
          ...newestArray
        ];

        markSymbolizer.func = functionArray;
      }
    }

    if (opacity) {
      markSymbolizer.opacity = parseFloat(opacity);
    }
    if (fillOpacity) {
      markSymbolizer.fillOpacity = parseFloat(fillOpacity);
    }
    if (color) {
      markSymbolizer.color = color;
    }
    if (rotation) {
      markSymbolizer.rotate = parseFloat(rotation);
    }
    if (size) {
      markSymbolizer.radius = parseFloat(size) / 2;
    }

    switch (wellKnownName) {
      case 'circle':
      case 'square':
      case 'triangle':
      case 'star':
      case 'cross':
      case 'x':
        const wkn = wellKnownName.charAt(0).toUpperCase() + wellKnownName.slice(1);
        markSymbolizer.wellKnownName = wkn as WellKnownName;
        break;
      case 'shape://vertline':
      case 'shape://horline':
      case 'shape://slash':
      case 'shape://backslash':
      case 'shape://dot':
      case 'shape://plus':
      case 'shape://times':
      case 'shape://oarrow':
      case 'shape://carrow':
        markSymbolizer.wellKnownName = wellKnownName as WellKnownName;
        break;
      default:
        if (WELLKNOWNNAME_TTF_REGEXP.test(wellKnownName)) {
          markSymbolizer.wellKnownName = wellKnownName as WellKnownName;
          break;
        }
        throw new Error('MarkSymbolizer cannot be parsed. Unsupported WellKnownName.');
    }

    strokeParams.forEach((param: any) => {
      switch (param.$.name) {
        case 'stroke':
          markSymbolizer.strokeColor = param._;
          break;
        case 'stroke-width':
          markSymbolizer.strokeWidth = parseFloat(param._);
          break;
        case 'stroke-opacity':
          markSymbolizer.strokeOpacity = parseFloat(param._);
          break;
        default:
          break;
      }
    });

    return markSymbolizer;
  }

  /**
   * Get the SLD Object (readable with xml2js) from an GeoStyler-Style MarkSymbolizer.
   *
   * @param {MarkSymbolizer} markSymbolizer A GeoStyler-Style MarkSymbolizer.
   * @return {object} The object representation of a SLD PointSymbolizer with a
   * Mark (readable with xml2js)
   */
   getSldPointSymbolizerFromMarkSymbolizer(markSymbolizer: GeoserverMarkSymbolizer): any {
    const isFontSymbol = WELLKNOWNNAME_TTF_REGEXP.test(markSymbolizer.wellKnownName);
    const mark: any[] = [{
      'WellKnownName': [
        isFontSymbol ? markSymbolizer.wellKnownName : markSymbolizer.wellKnownName.toLowerCase()
      ]
    }];

    if (markSymbolizer.color || markSymbolizer.fillOpacity) {
      const cssParameters: CssParam[] = [];
      if (markSymbolizer.color) {
        cssParameters.push({
          '_': markSymbolizer.color,
          '$': {
            'name': 'fill'
          }
        });
      }
      if (markSymbolizer.fillOpacity) {
        cssParameters.push({
          '_': markSymbolizer.fillOpacity,
          '$': {
            'name': 'fill-opacity'
          }
        });
      }
      mark[0].Fill = [{
        'CssParameter': cssParameters
      }];
    }

    if (markSymbolizer.strokeColor || markSymbolizer.strokeWidth || markSymbolizer.strokeOpacity) {
      mark[0].Stroke = [{}];
      const strokeCssParameters = [];
      if (markSymbolizer.strokeColor) {
        strokeCssParameters.push({
          '_': markSymbolizer.strokeColor,
          '$': {
            'name': 'stroke'
          }
        });
      }
      if (markSymbolizer.strokeWidth) {
        strokeCssParameters.push({
          '_': markSymbolizer.strokeWidth.toString(),
          '$': {
            'name': 'stroke-width'
          }
        });
      }
      if (markSymbolizer.strokeOpacity) {
        strokeCssParameters.push({
          '_': markSymbolizer.strokeOpacity.toString(),
          '$': {
            'name': 'stroke-opacity'
          }
        });
      }

      mark[0].Stroke[0].CssParameter = strokeCssParameters;
    }

    if (markSymbolizer.func) {
      const propertyName = markSymbolizer.func[1][1];
      const emptyArray: string[] = [];
      markSymbolizer.func.map((arr: string[], i: any) => {
        if (i !== 0) {
            emptyArray.push(arr[2]);
            if (arr.length === 4) { emptyArray.push(arr[3]); }
          }
      });

      const cssParameters = [];

      if (markSymbolizer.func[0] === 'Interpolate') {
        cssParameters.push({
          '$': {
            'name': 'fill'
          },
          'ogc:Function': {
            '$': { 'name': markSymbolizer.func[0] },
            'ogc:PropertyName': [propertyName],
            'ogc:Literal': emptyArray
          }
        });
      }

      mark[0].Fill = [{
        'CssParameter': cssParameters
      }];
    }

    const graphic: any[] = [{
      'Mark': mark
    }];

    if (markSymbolizer.opacity) {
      graphic[0].Opacity = [markSymbolizer.opacity.toString()];
    }

    if (markSymbolizer.radius) {
      graphic[0].Size = [(markSymbolizer.radius * 2).toString()];
    }

    if (markSymbolizer.rotate) {
      graphic[0].Rotation = [markSymbolizer.rotate.toString()];
    }

    return {
      'PointSymbolizer': [{
        'Graphic': graphic
      }]
    };
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
