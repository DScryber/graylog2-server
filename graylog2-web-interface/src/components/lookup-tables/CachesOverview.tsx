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
import React from 'react';

import {
  OverlayTrigger,
  PaginatedList,
  SearchForm,
  Spinner,
  Icon,
  NoSearchResult,
  NoEntitiesExist,
} from 'components/common';
import { Row, Col, Table, Popover, Button } from 'components/bootstrap';
import CacheTableEntry from 'components/lookup-tables/CacheTableEntry';
import withPaginationQueryParameter from 'components/common/withPaginationQueryParameter';
import { LookupTableCachesActions } from 'stores/lookup-tables/LookupTableCachesStore';
import type { LookupTableCache, PaginationType } from 'logic/lookup-tables/types';
import type { PaginationQueryParameterResult } from 'hooks/usePaginationQueryParameter';

import Styles from './Overview.css';

const buildHelpPopover = () => {
  return (
    <Popover id="search-query-help" className={Styles.popoverWide} title="Search Syntax Help">
      <p><strong>Available search fields</strong></p>
      <Table condensed>
        <thead>
          <tr>
            <th>Field</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>id</td>
            <td>Cache ID</td>
          </tr>
          <tr>
            <td>title</td>
            <td>The title of the cache</td>
          </tr>
          <tr>
            <td>name</td>
            <td>The reference name of the cache</td>
          </tr>
          <tr>
            <td>description</td>
            <td>The description of cache</td>
          </tr>
        </tbody>
      </Table>
      <p><strong>Examples</strong></p>
      <p>
        Find caches by parts of their names:<br />
        <kbd>name:guava</kbd><br />
        <kbd>name:gua</kbd>
      </p>
      <p>
        Searching without a field name matches against the <code>title</code> field:<br />
        <kbd>guava</kbd> <br />is the same as<br />
        <kbd>title:guava</kbd>
      </p>
    </Popover>
  );
};

type Props = {
  caches: LookupTableCache[],
  pagination: PaginationType,
  paginationQueryParameter: PaginationQueryParameterResult,
};

const CachesOverview = ({ caches, pagination, paginationQueryParameter }: Props) => {
  const [loading, setLoading] = React.useState(false);
  const [localPagination, setLocalPagination] = React.useState({
    currentPage: paginationQueryParameter.page || 1,
    currentPageSize: paginationQueryParameter.pageSize || 10,
    currentQuery: pagination.query || '',
    resetPage: paginationQueryParameter.resetPage,
    setPageSize: paginationQueryParameter.setPageSize,
  });

  React.useEffect(() => {
    const { currentPage, currentPageSize, currentQuery } = localPagination;

    LookupTableCachesActions.searchPaginated(currentPage, currentPageSize, currentQuery)
      .then(() => setLoading(false));
  }, [localPagination]);

  const onPageChange = React.useCallback((newPage: number, newPerPage: number) => {
    setLocalPagination({ ...localPagination, currentPage: newPage, currentPageSize: newPerPage });
  }, [localPagination]);

  const onSearch = React.useCallback((query: string) => {
    localPagination.resetPage();
    localPagination.setPageSize(localPagination.currentPageSize);
    setLocalPagination({ ...localPagination, currentPage: 1, currentQuery: query });
  }, [localPagination]);

  const onReset = React.useCallback(() => {
    localPagination.resetPage();
    localPagination.setPageSize(localPagination.currentPageSize);
    setLocalPagination({ ...localPagination, currentPage: 1, currentQuery: '' });
  }, [localPagination]);

  const getComponent = () => {
    switch (true) {
      case loading:
        return <Spinner text="Loading data adapters" />;
      case (caches.length === 0 && !!localPagination.currentQuery):
        return (
          <tbody>
            <tr>
              <td colSpan={6}>
                <NoSearchResult>No caches found with title &quot;{localPagination.currentQuery}&quot;</NoSearchResult>
              </td>
            </tr>
          </tbody>
        );
      case caches.length > 0:
        return caches.map((cache: LookupTableCache) => (
          <CacheTableEntry key={`cache-item-${cache.id}`} cache={cache} />
        ));
      default:
        return (
          <tbody>
            <tr>
              <td colSpan={6}>
                <NoEntitiesExist>There are no caches to list</NoEntitiesExist>
              </td>
            </tr>
          </tbody>
        );
    }
  };

  return (
    <Row className="content">
      <Col md={12}>
        <h2 style={{ marginBottom: 16 }}>
          Configured lookup Caches <small>{pagination.total} total</small>
        </h2>
        <PaginatedList activePage={localPagination.currentPage}
                       pageSize={localPagination.currentPageSize}
                       onChange={onPageChange}
                       totalItems={pagination.total}>
          <SearchForm query={localPagination.currentQuery} onSearch={onSearch} onReset={onReset}>
            <OverlayTrigger trigger="click" rootClose placement="right" overlay={buildHelpPopover()}>
              <Button bsStyle="link"
                      className={Styles.searchHelpButton}>
                <Icon name="question-circle" fixedWidth />
              </Button>
            </OverlayTrigger>
          </SearchForm>
          <div style={{ overflowX: 'auto' }}>
            <Table condensed hover className={Styles.overviewTable}>
              <thead>
                <tr>
                  <th className={Styles.rowTitle}>Title</th>
                  <th className={Styles.rowDescription}>Description</th>
                  <th className={Styles.rowName}>Name</th>
                  <th>Entries</th>
                  <th>Hit rate</th>
                  <th>Throughput</th>
                  <th className={Styles.rowActions}>Actions</th>
                </tr>
              </thead>
              {getComponent()}
            </Table>
          </div>
        </PaginatedList>
      </Col>
    </Row>
  );
};

export default withPaginationQueryParameter(CachesOverview);
