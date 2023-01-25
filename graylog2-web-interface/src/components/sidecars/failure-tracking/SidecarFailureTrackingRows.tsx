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
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Link } from 'components/common/router';
import RelativeTime from 'components/common/RelativeTime';
import Routes from 'routing/Routes';
import StatusIndicator from 'components/sidecars/common/StatusIndicator';
import SidecarStatusEnum from 'logic/sidecar/SidecarStatusEnum';
import { Button } from 'components/bootstrap';

import type { Collector, SidecarSummary } from '../types';

const VerboseMessageContainer = styled.div`
  height: 80px;
  overflow: hidden;
  margin-bottom: 6px;
`;

const CollectorName = styled.div`
  color: #94979c;
  font-style: italic;
`;

type Props = {
  sidecar: SidecarSummary,
  collectors: Collector[],
}

const SidecarFailureTrackingRows = ({ sidecar, collectors }: Props) => {
  const annotation = sidecar.active ? '' : ' (inactive)';
  let sidecarStatus = { status: null, message: null, id: null };

  if (sidecar.node_details.status && SidecarStatusEnum.isValidStatusCode(sidecar.node_details.status.status)) {
    sidecarStatus = {
      status: sidecar.node_details.status.status,
      message: sidecar.node_details.status.message,
      id: sidecar.node_id,
    };
  }

  const getCollectorInformation = (collectorId: string) => {
    const collectorData = collectors.find((collector) => collector.id === collectorId);

    return `${collectorData.name} · ${collectorData.node_operating_system}`;
  };

  const renderSidecarCollectorRows = () => {
    return sidecar.node_details.status.collectors.filter((collector) => collector.status === 2).map((collector) => (
      <tr key={collector.collector_id + collector.configuration_id}>
        <td>
          {sidecar.active
            ? (
              <Link to={Routes.SYSTEM.SIDECARS.STATUS(sidecar.node_id)}>
                {sidecar.node_name}
              </Link>
            )
            : sidecar.node_name + annotation}
          <CollectorName>{getCollectorInformation(collector.collector_id)}</CollectorName>
        </td>
        <td>
          <RelativeTime dateTime={sidecar.last_seen} />
        </td>
        <td>
          <StatusIndicator status={sidecarStatus.status}
                           message={sidecarStatus.message}
                           id={sidecarStatus.id}
                           lastSeen={sidecar.last_seen} />
        </td>
        <td>
          {collector.message}
        </td>
        <td>
          <VerboseMessageContainer>
            {collector.verbose_message}
          </VerboseMessageContainer>
          <Button bsStyle="link"
                  bsSize="xs"
                  onClick={() => {}}>
            Show Details
          </Button>
        </td>
      </tr>
    ));
  };

  return (
    <>
      {renderSidecarCollectorRows()}
    </>
  );
};

SidecarFailureTrackingRows.propTypes = {
  sidecar: PropTypes.object.isRequired,
};

export default SidecarFailureTrackingRows;
