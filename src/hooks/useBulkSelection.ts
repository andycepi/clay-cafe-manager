import { useState, useCallback, useMemo } from 'react';

interface UseBulkSelectionOptions<T> {
  items: T[];
  getId: (item: T) => string;
}

export const useBulkSelection = <T>({ items, getId }: UseBulkSelectionOptions<T>) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.includes(getId(item)));
  }, [items, selectedIds, getId]);

  const isSelected = useCallback((item: T) => {
    return selectedIds.includes(getId(item));
  }, [selectedIds, getId]);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedIds.length === items.length;
  }, [items.length, selectedIds.length]);

  const toggleSelection = useCallback((item: T) => {
    const id = getId(item);
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, [getId]);

  const selectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(getId));
    }
  }, [items, getId, isAllSelected]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setShowBulkActions(false);
  }, []);

  const toggleBulkActions = useCallback(() => {
    setShowBulkActions(prev => !prev);
  }, []);

  // Auto-hide bulk actions when no items selected
  const selectedCount = selectedIds.length;
  if (selectedCount === 0 && showBulkActions) {
    setShowBulkActions(false);
  }

  return {
    selectedIds,
    selectedItems,
    selectedCount,
    showBulkActions,
    isSelected,
    isAllSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleBulkActions,
    setShowBulkActions
  };
};