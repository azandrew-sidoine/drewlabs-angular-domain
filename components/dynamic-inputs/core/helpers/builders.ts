import { getObjectProperty } from "../../../../utils";
import { ControlInterface } from "../compact/types";
import {
  CheckboxItem,
  ISelectItem,
  RadioItem,
} from "../contracts/control-item";
import { parseControlItemsConfigs } from "./parsers";

export const buildRequiredIfConfig = (stringifiedConfig: string) => {
  if (stringifiedConfig?.indexOf(":") !== -1) {
    // split the string into the two parts
    const parts = stringifiedConfig.split(":");
    let values: any[] = [];
    const result =
      parts[1].indexOf("|") !== -1 ? parts[1].split("|") : [parts[1]];
    result.forEach((part) => {
      const split = part.indexOf(",") !== -1 ? part.split(",") : part;
      values = [...values, ...split];
    });
    return {
      formControlName: parts[0].trim(),
      values,
    };
  }
  return undefined;
};

export const buildCheckboxItems = (model: Partial<ControlInterface>) => {
  if (model.selectableValues) {
    const items = model.selectableValues?.split("|") || [];
    return items?.map((v, i) => {
      if (v.indexOf(":") !== -1) {
        const idValueFields = v.split(":");
        return {
          value: idValueFields[0].trim(),
          checked: i === 0,
          description: idValueFields[1].trim(),
        };
      } else {
        return {
          value: isNaN(+v.trim()) ? v.trim() : +v.trim(),
          checked: i === 0,
          description: v.trim(),
        };
      }
    });
  } else if (model.selectableModel) {
    let { keyfield, valuefield, groupfield } = parseControlItemsConfigs(model);
    keyfield = model.keyfield || keyfield;
    valuefield = model.valuefield || valuefield;
    groupfield = model.groupfield || groupfield;
    return model.options
      ? model.options.map((v, index) => {
          return {
            value: getObjectProperty(v, keyfield || ""),
            checked: index === 0,
            description: getObjectProperty(v, valuefield || ""),
          } as CheckboxItem;
        })
      : [];
  } else {
    return [];
  }
};

/**
 * @deprecated
 */
export const buildSelectItems = (model: Partial<ControlInterface>) => {
  if (model.selectableValues) {
    const items = model.selectableValues?.split("|") || [];
    return items.map((v, i) => {
      if (v.indexOf(":") !== -1) {
        const idValueFields = v.split(":");
        return {
          value: idValueFields[0].trim(),
          name: idValueFields[1].trim(),
          description: idValueFields[1].trim(),
        } as ISelectItem;
      } else {
        return {
          value: isNaN(+v.trim()) ? v.trim() : +v.trim(),
          name: v.trim(),
          description: v.trim(),
        } as ISelectItem;
      }
    });
  } else if (model.selectableModel) {
    let { keyfield, valuefield, groupfield } = parseControlItemsConfigs(model);
    keyfield = model.keyfield || keyfield;
    valuefield = model.valuefield || valuefield;
    groupfield = model.groupfield;
    return model.options
      ? model.options.map((v) => {
          return {
            value: getObjectProperty(v, keyfield || ""),
            description: getObjectProperty(v, valuefield || ""),
            name: getObjectProperty(v, valuefield || ""),
            type:
              groupfield && keyfield !== groupfield && valuefield !== groupfield
                ? getObjectProperty(v, groupfield || "")
                : undefined,
          } as ISelectItem;
        })
      : [];
  } else {
    return [];
  }
};

export const buildRadioInputItems = (model: Partial<ControlInterface>) => {
  if (model.selectableValues) {
    const items = model.selectableValues?.split("|") || [];
    return items.map((v, i) => {
      if (v.indexOf(":") !== -1) {
        const idValueFields = v.split(":");
        return {
          value: idValueFields[0].trim(),
          checked: i === 0,
          description: idValueFields[1].trim(),
        };
      } else {
        return {
          value: isNaN(+v.trim()) ? v.trim() : +v.trim(),
          checked: i === 0,
          description: v.trim(),
        };
      }
    });
  } else if (model.selectableModel) {
    let { keyfield, valuefield, groupfield } = parseControlItemsConfigs(model);
    keyfield = model.keyfield || keyfield;
    valuefield = model.valuefield || valuefield;
    groupfield = model.groupfield || groupfield;
    return model.options
      ? model.options.map((v, index) => {
          return {
            value: getObjectProperty(v, keyfield || ""),
            description: getObjectProperty(v, valuefield || ""),
            checked: index === 0,
          } as RadioItem;
        })
      : [];
  } else {
    return [];
  }
};
