import React, { RefObject } from "react";
import { Subscription } from "rxjs";
import { Model } from "react-3layer-common";
import { TreeNode } from "@Components/Tree/TreeNode";
import dayjs, { Dayjs } from "dayjs";
export const CommonService = {
  useSubscription() {
    const subscription = React.useRef(new Subscription()).current;
    React.useEffect(
      function () {
        return function cleanup() {
          subscription.unsubscribe();
        };
      },
      [subscription]
    );
    return [subscription];
  },

  useClickOutside(ref: RefObject<any>, callback: () => void) {
    const handleClickOutside = React.useCallback(
      (event : any) => {
        if (ref?.current && !ref?.current?.contains(event.target)) {
          callback();
        }
      },
      [callback, ref]
    );

    React.useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return function cleanup() {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [callback, handleClickOutside, ref]);
  },

  useClickOutsideMultiple(
    refFirst: RefObject<any>,
    ref: RefObject<any>,
    callback: () => void
  ) {
    const handleClickOutside = React.useCallback(
      (event: any) => {
        if (refFirst?.current && !refFirst?.current?.contains(event.target)) {
          if (ref.current) {
            if (!ref.current.contains(event.target)) {
              callback();
            }
          } else {
            callback();
          }
        }
      },
      [callback, ref, refFirst]
    );

    React.useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return function cleanup() {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [callback, handleClickOutside, ref]);
  },
  toDayjsDate(date: string): Dayjs {
    return dayjs(date);
  },


  isEmpty(obj: any) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) return false;
    }
    return true;
  },

  limitWord(input: string, max: number) {
    if (input?.length > max) {
      input = input.slice(0, max);
      const output: string = input + "...";
      return output;
    }
    return input;
  },

  useStateCallback(initialState: any) {
    const [state, setState] = React.useState(initialState);

    const cbRef = React.useRef(null);

    const setStateCallback = React.useCallback((state:any, cb:any) => {
      cbRef.current = cb;
      setState(state);
    }, []);

    React.useEffect(() => {
      if (cbRef.current) {
        cbRef.current(state);
        cbRef.current = null;
      }
    }, [state]);

    return [state, setStateCallback];
  },

  uniqueArray(array: any[]) {
    return array.reduce((acc, current) => {
      const x = acc.find((item: { id: any }) => item.id === current.id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
  },

  arrayMove(arr: any[], fromIndex: number, toIndex: number) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
  },

  buildTree<T extends Model>(
    listItem: T[],
    parent?: TreeNode<T>,
    keyNodes?: number[],
    tree?: TreeNode<T>[]
  ): [TreeNode<T>[], number[]] {
    tree = typeof tree !== "undefined" ? tree : [];
    parent = typeof parent !== "undefined" ? parent : new TreeNode();
    keyNodes = typeof keyNodes !== "undefined" ? keyNodes : [];

    var children = listItem
      .filter((child) => {
        return child.parentId === parent.key;
      })
      .map((currentItem) => new TreeNode(currentItem));

    if (children && children.length) {
      if (parent.key === null) {
        tree = children;
      } else {
        parent.children = children;
        keyNodes.push(parent.key);
      }
      children.forEach((child) => {
        this.buildTree(listItem, child, keyNodes);
      });
    }

    return [tree, keyNodes];
  },

  listToTree<T extends Model & { children: any[] }>(list: T[]) {
    var map: any = {},
      node,
      roots = [],
      i;

    for (i = 0; i < list.length; i += 1) {
      map[list[i].id] = i;
      list[i].children = [];
    }

    for (i = 0; i < list.length; i += 1) {
      node = list[i];
      if (node.parentId !== null) {
        list[map[node.parentId]].children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  },

  setDisabledNode<T extends Model>(nodeId: number, tree: TreeNode<T>[]) {
    var filteredNode = tree.filter(
      (currentNode) => currentNode.key === nodeId
    )[0];
    if (filteredNode) {
      let index = tree.indexOf(filteredNode);
      tree[index].disabled = true;
      if (filteredNode.children && filteredNode.children.length > 0) {
        filteredNode.children.forEach((currentChildren) => {
          this.setDisabledNode(currentChildren.key, filteredNode.children);
        });
      }
    } else {
      tree.forEach((currentTree) => {
        if (currentTree.children && currentTree.children.length > 0) {
          this.setDisabledNode(nodeId, currentTree.children);
        }
      });
    }
  },

  setOnlySelectLeaf<T extends Model>(tree: TreeNode<T>[]) {
    if (tree && tree.length) {
      tree.forEach((currentNode) => {
        if (currentNode.item.hasChildren) {
          currentNode.disabled = true;
          this.setOnlySelectLeaf(currentNode.children);
        } else {
          currentNode.disabled = false;
        }
      });
    }
  },
};
