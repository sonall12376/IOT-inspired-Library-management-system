package com.library.smartlibrary.models;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "floors")
public class Floor {
    @Id
    private String id;

    @Indexed(unique = true)
    private Integer floorNumber;

    private String name;

    private GridDimensions gridDimensions;

    private String svgLayoutPath;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    public static class GridDimensions {
        private Integer rows;
        private Integer columns;

        public GridDimensions() {}

        public GridDimensions(Integer rows, Integer columns) {
            this.rows = rows;
            this.columns = columns;
        }

        public Integer getRows() {
            return rows;
        }

        public void setRows(Integer rows) {
            this.rows = rows;
        }

        public Integer getColumns() {
            return columns;
        }

        public void setColumns(Integer columns) {
            this.columns = columns;
        }
    }

    public Floor() {}

    public Floor(Integer floorNumber, String name, GridDimensions gridDimensions) {
        this.floorNumber = floorNumber;
        this.name = name;
        this.gridDimensions = gridDimensions;
    }

    public String getId() {
        return id;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("_id")
    public String get_id() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getFloorNumber() {
        return floorNumber;
    }

    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public GridDimensions getGridDimensions() {
        return gridDimensions;
    }

    public void setGridDimensions(GridDimensions gridDimensions) {
        this.gridDimensions = gridDimensions;
    }

    public String getSvgLayoutPath() {
        return svgLayoutPath;
    }

    public void setSvgLayoutPath(String svgLayoutPath) {
        this.svgLayoutPath = svgLayoutPath;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}
