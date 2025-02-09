/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

import { Button } from 'components/bootstrap';
import { PaginatedList, SearchForm, Spinner, NoEntitiesExist, NoSearchResult } from 'components/common';
import type View from 'views/logic/views/View';
import ViewLoaderContext from 'views/logic/ViewLoaderContext';
import QueryHelper from 'components/common/QueryHelper';
import type { ColumnRenderers } from 'components/common/EntityDataTable';
import EntityDataTable from 'components/common/EntityDataTable';
import Routes from 'routing/Routes';
import { Link } from 'components/common/router';
import FavoriteIcon from 'views/components/FavoriteIcon';
import type { Sort } from 'stores/PaginationTypes';
import useSavedSearches from 'views/hooks/useSavedSearches';

import BulkActions from './BulkActions';

type SearchParams = {
  page: number,
  pageSize: number,
  query: string,
  sort: Sort
}

const INITIAL_COLUMNS = ['title', 'description', 'summary', 'favorite'];
const COLUMNS_ORDER = ['title', 'summary', 'description', 'owner', 'created_at', 'favorite'];

const DEFAULT_PAGINATION = {
  query: '',
  page: 1,
  pageSize: 10,
};

const onLoad = (onLoadSavedSearch: () => void, selectedSavedSearchId: string, loadFunc: (searchId: string) => void) => {
  if (!selectedSavedSearchId || !loadFunc) {
    return false;
  }

  loadFunc(selectedSavedSearchId);

  onLoadSavedSearch();

  return false;
};

const customColumnRenderers = (onLoadSavedSearch: () => void, {
  queryClient,
  searchParams,
}: { queryClient: QueryClient, searchParams: SearchParams}): ColumnRenderers<View> => ({
  title: {
    renderCell: (search) => (
      <ViewLoaderContext.Consumer key={search.id}>
        {(loaderFunc) => {
          const onClick = (e) => {
            e.preventDefault();
            onLoad(onLoadSavedSearch, search.id, loaderFunc);
          };

          return (
            <Link onClick={onClick}
                  to={Routes.getPluginRoute('SEARCH_VIEWID')(search.id)}>
              {search.title}
            </Link>
          );
        }}
      </ViewLoaderContext.Consumer>
    ),
  },
  favorite: {
    renderCell: (search) => (
      <FavoriteIcon isFavorite={search.favorite}
                    id={search.id}
                    onChange={(newValue) => {
                      queryClient.setQueriesData(['saved-searches', 'overview', searchParams], (cur: {
                        list: Array<View>,
                        pagination: { total: number }
                      }) => ({
                        ...cur,
                        list: cur.list.map((view) => {
                          if (view.id === search.id) {
                            return ({ ...view, favorite: newValue });
                          }

                          return view;
                        }),
                      }
                      ));
                    }} />
    ),
  },
});

const onDelete = (e, savedSearch: View, deleteSavedSearch: (search: View) => Promise<View>, activeSavedSearchId: string, refetch: () => void) => {
  e.stopPropagation();

  // eslint-disable-next-line no-alert
  if (window.confirm(`You are about to delete saved search: "${savedSearch.title}". Are you sure?`)) {
    deleteSavedSearch(savedSearch).then(() => {
      if (savedSearch.id !== activeSavedSearchId) {
        refetch();
      }
    });
  }
};

const renderBulkActions = (
  selectedSavedSearchIds: Array<string>,
  setSelectedSavedSearchIds: (streamIds: Array<string>) => void,
) => (
  <BulkActions selectedSavedSearchIds={selectedSavedSearchIds}
               setSelectedSavedSearchIds={setSelectedSavedSearchIds} />
);

type Props = {
  activeSavedSearchId: string,
  deleteSavedSearch: (view: View) => Promise<View>,
  onLoadSavedSearch: () => void,
};

const SavedSearchesList = ({
  activeSavedSearchId,
  deleteSavedSearch,
  onLoadSavedSearch,
}: Props) => {
  const queryClient = useQueryClient();
  const [visibleColumns, setVisibleColumns] = useState(INITIAL_COLUMNS);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: DEFAULT_PAGINATION.page,
    pageSize: DEFAULT_PAGINATION.pageSize,
    query: DEFAULT_PAGINATION.query,
    sort: {
      attributeId: 'title',
      direction: 'asc',
    },
  });

  const { data: paginatedSavedSearches, isLoading, refetch } = useSavedSearches(searchParams);

  const handleSearch = useCallback(
    (newQuery: string) => setSearchParams((cur) => ({
      ...cur,
      query: newQuery,
      page: DEFAULT_PAGINATION.page,
    })),
    [],
  );
  const handlePageSizeChange = useCallback(
    (newPage: number, newPageSize: number) => setSearchParams((cur) => ({
      ...cur,
      page: newPage,
      pageSize: newPageSize,
    })),
    [],
  );
  const onSortChange = useCallback((newSort: Sort) => {
    setSearchParams((cur) => ({ ...cur, sort: newSort, page: 1 }));
  }, []);

  const onResetSearch = useCallback(() => handleSearch(''), [handleSearch]);
  const onColumnsChange = useCallback((newVisibleColumns: Array<string>) => {
    setVisibleColumns(newVisibleColumns);
  }, []);

  const renderSavedSearchActions = useCallback((search: View) => (
    <Button onClick={(e) => onDelete(e, search, deleteSavedSearch, activeSavedSearchId, refetch)}
            role="button"
            bsSize="xsmall"
            bsStyle="danger"
            title={`Delete search ${search.title}`}
            tabIndex={0}>
      Delete
    </Button>
  ), [activeSavedSearchId, deleteSavedSearch, refetch]);

  const columnRenderers = useMemo(
    () => customColumnRenderers(onLoadSavedSearch, { queryClient, searchParams }),
    [onLoadSavedSearch, queryClient, searchParams],
  );

  if (isLoading) {
    return <Spinner />;
  }

  const { list: savedSearches, pagination, attributes } = paginatedSavedSearches;

  return (
    <PaginatedList onChange={handlePageSizeChange}
                   activePage={searchParams.page}
                   totalItems={pagination?.total}
                   pageSize={searchParams.pageSize}
                   useQueryParameter={false}>
      <div style={{ marginBottom: '5px' }}>
        <SearchForm focusAfterMount
                    onSearch={handleSearch}
                    queryHelpComponent={<QueryHelper entityName="search" commonFields={['id', 'title']} />}
                    topMargin={0}
                    onReset={onResetSearch} />
      </div>
      {pagination?.total === 0 && !searchParams.query && (
        <NoEntitiesExist>
          No saved searches have been created yet.
        </NoEntitiesExist>
      )}
      {pagination?.total === 0 && searchParams.query && (
        <NoSearchResult>
          No saved searches found.
        </NoSearchResult>
      )}
      {!!savedSearches?.length && (
        <EntityDataTable<View> data={savedSearches}
                               visibleColumns={visibleColumns}
                               columnsOrder={COLUMNS_ORDER}
                               onColumnsChange={onColumnsChange}
                               bulkActions={renderBulkActions}
                               onSortChange={onSortChange}
                               activeSort={searchParams.sort}
                               rowActions={renderSavedSearchActions}
                               columnRenderers={columnRenderers}
                               columnDefinitions={attributes} />
      )}
    </PaginatedList>
  );
};

export default SavedSearchesList;
