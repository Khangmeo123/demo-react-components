import { DateFilter } from "react-3layer-advance-filters";
import { IdFilter } from "react-3layer-advance-filters";
import { NumberFilter } from "react-3layer-advance-filters";
import { StringFilter } from "react-3layer-advance-filters";
import { ModelFilter, OrderType } from "react-3layer-common";
import React, { Dispatch, SetStateAction, useState } from "react";
import { ActionFilterEnum } from "@Configs/enum";
import dayjs, { Dayjs } from "dayjs";



export class Filter { }

type CoreFilter = StringFilter | NumberFilter | DateFilter | IdFilter;

export interface AdvanceFilterAction<
  T1,
  T2 = CoreFilter // default
> {
  type: ActionFilterEnum;
  classFilter?: new (params: any) =>
    | StringFilter
    | NumberFilter
    | DateFilter
    | IdFilter;
  data?: T1;
  fieldName?: keyof T1 | string;
  fieldType?: keyof T2 | string;
  fieldValue?: any;
  skip?: number;
  take?: number;
  orderBy?: string | number | (string | number)[];
  orderType?: OrderType;
}

export function advanceFilterReducer<T1 extends ModelFilter>(
  state: T1,
  action: AdvanceFilterAction<T1>
): T1 {
  switch (action.type) {
    case ActionFilterEnum.ChangeOneField:
      return {
        ...state,
        skip: 0,
        [action.fieldName as string]: new action.classFilter({
          [action.fieldType as string]: action.fieldValue,
        }),
      };
    case ActionFilterEnum.ChangeAllField:
      return action.data;
    case ActionFilterEnum.ChangeSkipTake:
      return {
        ...state,
        skip: action.skip,
        take: action.take,
      };
    case ActionFilterEnum.ChangeOrderType:
      return {
        ...state,
        orderBy: action.orderBy,
        orderType: action.orderType,
      };
  }
}

export const advanceFilterService = {
  useFilter<TFilter extends ModelFilter>(
    modelFilter: TFilter,
    dispatch: (
      action: AdvanceFilterAction<
        TFilter,
        StringFilter | NumberFilter | DateFilter | IdFilter
      >
    ) => void,
    ClassFilter: new () => TFilter
  ): {
    handleChangeFilter: (
      fieldName: keyof TFilter,
      fieldType:
        | keyof (StringFilter | NumberFilter | DateFilter | IdFilter)
        | (keyof StringFilter | NumberFilter | DateFilter | IdFilter)[],
      ClassSubFilter: new (params: any) =>
        | StringFilter
        | NumberFilter
        | DateFilter
        | IdFilter,
      handleSearch?: () => void
    ) => (value: any) => void;
    handleResetFilter: (handleSearch?: () => void) => () => void;
    handleUpdateNewFilter: (data: TFilter, handleSearch?: () => void) => void;
  } {
    const handleChangeFilter = React.useCallback(
      (
        fieldName: keyof TFilter,
        fieldType:
          | keyof (StringFilter | NumberFilter | DateFilter | IdFilter)
          | (keyof StringFilter | NumberFilter | DateFilter | IdFilter)[],
        ClassSubFilter: new (params: any) =>
          | StringFilter
          | NumberFilter
          | DateFilter
          | IdFilter,
        handleSearch?: () => void
      ) => (value: any) => {
        if (fieldType instanceof Array) {
          dispatch({
            type: ActionFilterEnum.ChangeAllField,
            data: {
              ...modelFilter,
              [fieldName]: new ClassSubFilter({
                ["greater"]: value[0],
                ["less"]: value[1],
              }),
            },
          });
        } else {
          if (value instanceof Array) {
            dispatch({
              type: ActionFilterEnum.ChangeOneField,
              fieldName: fieldName,
              fieldType: fieldType,
              fieldValue: value[0] ? value[0].id : null,
              classFilter: ClassSubFilter,
            });
          } else {
            dispatch({
              type: ActionFilterEnum.ChangeOneField,
              fieldName: fieldName,
              fieldType: fieldType,
              fieldValue: value,
              classFilter: ClassSubFilter,
            });
          }
        }
        if (typeof handleSearch === "function") {
          handleSearch();
        }
      },
      [dispatch, modelFilter]
    );

    const handleResetFilter = React.useCallback(
      (handleSearch?: () => void) => {
        return () => {
          const newFilter = new ClassFilter();
          newFilter.skip = 0;
          newFilter.take = 10;

          dispatch({
            type: ActionFilterEnum.ChangeAllField,
            data: newFilter,
          });
          if (typeof handleSearch === "function") {
            handleSearch();
          }
        };
      },
      [dispatch, ClassFilter]
    );

    const handleUpdateNewFilter = React.useCallback(
      (data: TFilter, handleSearch?: () => void) => {
        dispatch({ type: ActionFilterEnum.ChangeAllField, data });
        if (typeof handleSearch === "function") {
          handleSearch();
        }
      },
      [dispatch]
    );

    return {
      handleChangeFilter,
      handleResetFilter,
      handleUpdateNewFilter,
    };
  }, // deprecate

  useChangeAdvanceFilter<TFilter extends ModelFilter>(
    modelFilter: TFilter,
    dispatch: (
      action: AdvanceFilterAction<
        TFilter,
        StringFilter | NumberFilter | DateFilter | IdFilter
      >
    ) => void,
    ClassFilter: new () => TFilter,
    defaultValue?: boolean
  ): {
    loadList: boolean;
    setLoadList: Dispatch<SetStateAction<boolean>>;
    handleSearch: () => void;
    handleChangeFilter: (
      fieldName: keyof TFilter,
      fieldType:
        | keyof (StringFilter | NumberFilter | DateFilter | IdFilter)
        | (keyof StringFilter | NumberFilter | DateFilter | IdFilter)[],
      ClassSubFilter: new (params: any) =>
        | StringFilter
        | NumberFilter
        | DateFilter
        | IdFilter
    ) => (value: any) => void;
    handleResetFilter: () => void;
    handleUpdateNewFilter: (filter: TFilter) => void;
  } {
    const [loadList, setLoadList] = useState<boolean>(
      typeof defaultValue === "undefined" ? true : defaultValue
    ); // default true when using in master or local

    const handleSearch = React.useCallback(() => {
      setLoadList(true);
    }, []);

    const handleChangeFilter = React.useCallback(
      (
        fieldName: keyof TFilter,
        fieldType:
          | keyof (StringFilter | NumberFilter | DateFilter | IdFilter)
          | (keyof StringFilter | NumberFilter | DateFilter | IdFilter)[],
        ClassSubFilter: new (params: any) =>
          | StringFilter
          | NumberFilter
          | DateFilter
          | IdFilter
      ) => (value: any) => {
        if (fieldType instanceof Array) {
          dispatch({
            type: ActionFilterEnum.ChangeAllField,
            data: {
              ...modelFilter,
              skip: 0,
              [fieldName]: new ClassSubFilter({
                ["greaterEqual"]: value[0],
                ["lessEqual"]: value[1],
              }),
            },
          });
        } else {
          if (value instanceof Array) {
            if (dayjs.isDayjs((value[0])) ) {
              dispatch({
                type: ActionFilterEnum.ChangeAllField,
                data: {
                  ...modelFilter,
                  skip: 0,
                  [fieldName]: new ClassSubFilter({
                    ["greater"]: value[0],
                    ["less"]: value[1],
                  }),
                },
              });
            } else {
              const ids = value.map((item) => item?.id);
              if (ids && typeof ids[0] !== "undefined") {
                dispatch({
                  type: ActionFilterEnum.ChangeAllField,
                  data: {
                    ...modelFilter,
                    skip: 0,
                    [fieldName]: new ClassSubFilter({
                      ["in"]: ids,
                    }),
                  },
                });
              } else {
                dispatch({
                  type: ActionFilterEnum.ChangeAllField,
                  data: {
                    ...modelFilter,
                    skip: 0,
                    [fieldName]: {
                      ["greaterEqual"]: value[0],
                      ["lessEqual"]: value[1],
                    },
                  },
                });
              }
            }
          } else {
            dispatch({
              type: ActionFilterEnum.ChangeOneField,
              fieldName: fieldName,
              fieldType: fieldType as string,
              fieldValue: value,
              classFilter: ClassSubFilter,
            });
          }
        }
        handleSearch();
      },
      [dispatch, modelFilter, handleSearch]
    );

    const handleResetFilter = React.useCallback(() => {
      const newFilter = new ClassFilter();
      newFilter.skip = 0;
      newFilter.take = 10;

      dispatch({
        type: ActionFilterEnum.ChangeAllField,
        data: newFilter,
      });
      handleSearch();
    }, [dispatch, ClassFilter, handleSearch]);

    const handleUpdateNewFilter = React.useCallback(
      (data: TFilter) => {
        dispatch({ type: ActionFilterEnum.ChangeAllField, data });
        handleSearch();
      },
      [dispatch, handleSearch]
    );

    return {
      loadList,
      setLoadList,
      handleSearch,
      handleChangeFilter,
      handleResetFilter,
      handleUpdateNewFilter,
    };
  },

  useStringFilter<T1Filter extends ModelFilter>(
    modelFilter: T1Filter,
    dispatch: (action: AdvanceFilterAction<T1Filter>) => void,
    fieldName: keyof T1Filter,
    fieldType: keyof StringFilter
  ): [string, (value: string) => void] {
    const value = modelFilter[fieldName][fieldType];
    const handleChangeFilter = React.useCallback(
      (value: string) => {
        dispatch({
          type: ActionFilterEnum.ChangeOneField,
          fieldName: fieldName,
          fieldType: fieldType as keyof CoreFilter,
          fieldValue: value,
        });
      },
      [dispatch, fieldName, fieldType]
    );
    return [value, handleChangeFilter];
  },

  useAdvanceFilterRange<
    T1Filter extends ModelFilter,
    T2Filter extends ModelFilter
  >(
    modelFilter: T1Filter,
    dispatch: (action: AdvanceFilterAction<T1Filter, T2Filter>) => void,
    fieldName: keyof T1Filter,
    ClassFilter: new (partial?: any) => T2Filter
  ): [[any, any], (valueRange: [any, any]) => void] {
    const valueFrom = modelFilter[fieldName]["greater"];
    const valueTo = modelFilter[fieldName]["less"];
    const value: [any, any] = [valueFrom, valueTo];
    const handleChangeRange = React.useCallback(
      (valueRange: [any, any]) => {
        dispatch({
          type: ActionFilterEnum.ChangeAllField,
          data: {
            ...modelFilter,
            [fieldName]: new ClassFilter({
              ["greater"]: valueRange[0],
              ["less"]: valueRange[1],
            }),
          },
        });
      },
      [dispatch, fieldName, modelFilter, ClassFilter]
    );
    return [value, handleChangeRange];
  },

  useNumberFilter<T1Filter extends ModelFilter>(
    modelFilter: T1Filter,
    dispatch: (action: AdvanceFilterAction<T1Filter>) => void,
    fieldName: keyof T1Filter,
    fieldType: keyof NumberFilter
  ): [number, (value: number) => void] {
    const value = modelFilter[fieldName][fieldType];
    const handleChangeFilter = React.useCallback(
      (value: number) => {
        dispatch({
          type: ActionFilterEnum.ChangeOneField,
          fieldName: fieldName,
          fieldType: fieldType as keyof CoreFilter,
          fieldValue: value,
        });
      },
      [dispatch, fieldName, fieldType]
    );

    return [value, handleChangeFilter];
  },

  useIdFilter<T1Filter extends ModelFilter>(
    modelFilter: T1Filter,
    dispatch: (action: AdvanceFilterAction<T1Filter>) => void,
    fieldName: keyof T1Filter,
    fieldType: keyof CoreFilter
  ): [number, (id: number) => void] {
    const idValue = modelFilter[fieldName][fieldType];
    const handleIdFilter = React.useCallback(
      (id: number) => {
        dispatch({
          type: ActionFilterEnum.ChangeOneField,
          fieldName: fieldName,
          fieldType: fieldType,
          fieldValue: id || null,
          classFilter: IdFilter,
        });
      },
      [dispatch, fieldName, fieldType]
    );
    return [idValue, handleIdFilter];
  },

  useDateFilter<T1Filter extends ModelFilter>(
    modelFilter: T1Filter,
    dispatch: (action: AdvanceFilterAction<T1Filter>) => void,
    fieldName: keyof T1Filter,
    fieldType: keyof DateFilter
  ): [Dayjs, (date: Dayjs) => void] {
    const value = modelFilter[fieldName][fieldType];
    const handleDateFilter = React.useCallback(
      (date: Dayjs) => {
        dispatch({
          type: ActionFilterEnum.ChangeOneField,
          fieldName: fieldName,
          fieldType: fieldType as keyof CoreFilter,
          fieldValue: date || null,
        });
      },
      [dispatch, fieldName, fieldType]
    );

    return [value, handleDateFilter];
  },

  useNumberRangeFilter<T1Filter extends ModelFilter>(
    modelFilter: T1Filter,
    dispatch: (action: AdvanceFilterAction<T1Filter>) => void,
    fieldName: keyof T1Filter
  ): [[number, number], (numberRange: [number, number]) => void] {
    const valueFrom =
      modelFilter[fieldName]["greaterEqual"];
    const valueTo =
      modelFilter[fieldName]["lessEqual"];
    const value: [number, number] = [valueFrom, valueTo];
    const handleChangeNumberRange = React.useCallback(
      (numberRange: [number, number]) => {
        dispatch({
          type: ActionFilterEnum.ChangeAllField,
          data: {
            ...modelFilter,
            [fieldName]: {
              ["greaterEqual"]: numberRange[0],
              ["lessEqual"]: numberRange[1],
            },
          },
        });
      },
      [dispatch, fieldName, modelFilter]
    );
    return [value, handleChangeNumberRange];
  },

  useDateRangeFilter<T1Filter extends ModelFilter>(
    modelFilter: T1Filter,
    dispatch: (action: AdvanceFilterAction<T1Filter>) => void,
    fieldName: keyof T1Filter
  ): [[Dayjs, Dayjs], (dateRange: [Dayjs, Dayjs]) => void] {
    const valueFrom =
      modelFilter[fieldName]["greater"] || null;
    const valueTo =
      modelFilter[fieldName]["less"] || null;
    const value: [Dayjs, Dayjs] = [valueFrom, valueTo];
    const handleDateRangeFilter = React.useCallback(
      (dateRange: [Dayjs, Dayjs]) => {
        dispatch({
          type: ActionFilterEnum.ChangeAllField,
          data: {
            ...modelFilter,
            [fieldName]: {
              ["greater"]: dateRange[0] || null,
              ["less"]: dateRange[1] || null,
            },
          },
        });
      },
      [dispatch, fieldName, modelFilter]
    );
    return [value, handleDateRangeFilter];
  },
};
