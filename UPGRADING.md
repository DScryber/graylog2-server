Upgrading to Graylog 5.1.x
==========================

## New Functionality

### Index Default Configuration
Support for configuring index defaults has been added:
1) Adds the ability to specify Index Set initialization default settings in the server configuration file for new Graylog clusters.
2) Adds the ability to subsequently maintain the current Index Set defaults from the System > Configurations page
   and through the Graylog API.

#### New Graylog Cluster Index Set Initialization Defaults
New Graylog server clusters can now initialize the settings for Index Sets with the following server configuration
values. Please see the sample [graylog.conf](https://github.com/Graylog2/graylog2-server/blob/master/misc/graylog.conf) file for more details and example values.

- `elasticsearch_analyzer`
- `elasticsearch_shards`
- `elasticsearch_replicas`
- `disable_index_optimization`
- `index_optimization_max_num_segments`
- `index_field_type_periodical_full_refresh_interval`
- `rotation_strategy`
- `elasticsearch_max_docs_per_index`
- `elasticsearch_max_size_per_index`
- `elasticsearch_max_time_per_index`
- `retention_strategy`
- `elasticsearch_max_number_of_indices`

If you are using a pre-existing version of the `graylog.conf` configuration file, it is recommended that you review the
aforementioned settings there before upgrading, to ensure the in-database defaults are established as expected with the
upgrade. Although the `graylog.conf` sample configuration file now ships with all index default example
properties commented out, you may be using an older version of the file where certain index default values were present
and not commented-out.

All previously deprecated index set configuration properties in `org.graylog2.configuration.ElasticsearchConfiguration`
have been un-deprecated, as Graylog intends to maintain them going forward.

Once the first Graylog server instance is started to establish the cluster, the following system indexes will be created
with the specified defaults.

- Default index set
- Graylog Events
- Graylog System Events
- Graylog Message Failures
- Restored Archives

#### In-database Cluster Index Set Defaults

The current in-database defaults for new Index Sets can now be edited from the new System > Configuration >
Index Set defaults configuration area. The default values set here will be used for all new index sets created:

- Those created from the System > Index Sets page.
- New indexes created through the Graylog Illuminate system.

Once the upgrade is installed, these in-database defaults will be established, and the server configuration option
values described above will no longer be used.

The in-database Index Set default configuration can also be edited VIA the Graylog API:

```
curl 'http://graylog-server:8080/api/system/indices/index_set_defaults' \
  -X 'PUT' \
  -H 'Content-Type: application/json' \
  -H 'X-Requested-By: my-api-request' \
  --data-raw '
  {
    "index_analyzer": "standard",
    "shards": 1,
    "replicas": 0,
    "index_optimization_max_num_segments": 1,
    "index_optimization_disabled": false,
    "field_type_refresh_interval": 300,
    "field_type_refresh_interval_unit": "SECONDS",
    "rotation_strategy_class": "org.graylog2.indexer.rotation.strategies.SizeBasedRotationStrategy",
    "rotation_strategy_config": {
      "type": "org.graylog2.indexer.rotation.strategies.SizeBasedRotationStrategyConfig",
      "max_size": 32212254720
    },
    "retention_strategy_class": "org.graylog2.indexer.retention.strategies.DeletionRetentionStrategy",
    "retention_strategy_config": {
      "type": "org.graylog2.indexer.retention.strategies.DeletionRetentionStrategyConfig",
      "max_number_of_indices": 20
    }
  }'
```

#### New Index Default values
Unless user-specified defaults are specified, the following new defaults will be effective for all new index sets created:

- Shards: 1 (previously 4 in many cases)
- Rotation Strategy: Index Size - 30GB (previously Index Time [1D] in many cases)

# API Changes
The following Java Code API changes have been made.

| File/method                                  | Description                                                                                                 |
|----------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `IndexSetValidator#validateRefreshInterval`  | The method argument have changed from `IndexSetConfig` to `Duration`                                        |
| `IndexSetValidator#validateRetentionPeriod`  | The method argument have changed from `IndexSetConfig` to `RotationStrategyConfig, RetentionStrategyConfig` |
| `ElasticsearchConfiguration#getIndexPrefix`  | The method name has changed to `getDefaultIndexPrefix`                                                      |
| `ElasticsearchConfiguration#getTemplateName` | The method name has changed to `getDefaultIndexTemplateName`                                                |

All previously deprecated index set configuration properties in `org.graylog2.configuration.ElasticsearchConfiguration`
have been un-deprecated, as Graylog intends to maintain them going forward. 

## REST API Endpoint Changes

| Endpoint                    | Description                                                       |
|-----------------------------|-------------------------------------------------------------------|
| `GET /system/configuration` | Key `gc_warning_threshold` has been removed from response object. |                                                                                                

## Behaviour Changes

- The `JSON path value from HTTP API` input will now only run on the leader node, if the `Global` option has been selected in the input configuration. Previously, the input was started on all nodes in the cluster.
- The default connection and read timeouts for email sending have been reduced from 60 seconds to 10 seconds.

## Configuration File Changes

| Option                                      | Action  | Description                                                                                |
|---------------------------------------------|---------|--------------------------------------------------------------------------------------------|
| `gc_warning_threshold`                      | removed | GC warnings have been removed.                                                             |
| `transport_email_socket_connection_timeout` | added   | Connection timeout for establishing a connection to the email server. Default: 10 seconds. |
| `transport_email_socket_timeout`            | added   | Read timeout while communicating with the email server. Default: 10 seconds.               |"
