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
package org.graylog.plugins.views.search.searchtypes.pivot.series;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.google.auto.value.AutoValue;
import org.graylog.plugins.views.search.searchtypes.pivot.SeriesSpec;

import java.util.Optional;

@AutoValue
@JsonTypeName(Max.NAME)
@JsonDeserialize(builder = Max.Builder.class)
public abstract class Max implements SeriesSpec {
    public static final String NAME = "max";
    @Override
    public abstract String type();

    @Override
    public abstract String id();

    @Override
    @JsonProperty
    public abstract String field();

    public static Builder builder() {
        return new AutoValue_Max.Builder().type(NAME);
    }

    @AutoValue.Builder
    public abstract static class Builder extends SeriesSpecBuilder<Max, Builder> {
        @JsonCreator
        public static Builder create() {
            return Max.builder();
        }

        @Override
        @JsonProperty
        public abstract Builder id(String id);

        @Override
        @JsonProperty
        public abstract Builder field(String field);

        abstract Optional<String> id();
        abstract String field();
        abstract Max autoBuild();

        @Override
        public Max build() {
            if (!id().isPresent()) {
                id(NAME + "(" + field() + ")");
            }
            return autoBuild();
        }
    }
}
