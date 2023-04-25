import { getObjectProperty } from "../../../../utils/types";
import { ISelectItem } from "../contracts/control-item";
import { BindingControlInterface } from "../contracts/dynamic-input";

export const controlBindingsSetter = <T extends BindingControlInterface>(
  values: { [prop: string]: any }[]
) => {
  values = values ?? [];
  return (control: Partial<T>) => {
    let result: any[] = [];
    if (control.clientBindings) {
      const items = control.clientBindings?.split("|") || [];
      result = items.map((v) => {
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
    } else {
      const [k, v, g] = [
        control.keyfield ?? "id",
        control.valuefield ?? "label",
        control.groupfield ?? "id",
      ];
      result = values.map((_v) => {
        return {
          value: getObjectProperty(_v, k),
          description: getObjectProperty(_v, v),
          name: getObjectProperty(_v, v || ""),
          type: g && k !== g && v !== g ? getObjectProperty(_v, g) : undefined,
        } as ISelectItem;
      });
    }
    return { ...control, items: result } as T;
  };
};
