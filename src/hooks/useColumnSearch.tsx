import { SearchOutlined } from "@ant-design/icons";
import { Input } from "antd";
import { useRef, useState } from "react";
import Highlighter from "react-highlight-words";

export const useColumnSearch = () => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const handleSearch = (selectedKeys: any, dataIndex: any) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const getColumnSearchProps = (dataIndex: string) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }: any) => (
      <div onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          allowClear
          onChange={(e) => {
            const value = e.target.value;
            setSelectedKeys(value ? [value] : []);
            handleSearch([value], dataIndex);
            confirm({ closeDropdown: false });
          }}
        />
      </div>
    ),
    // The header band is the brand fill, so an active filter cannot be marked
    // by turning the icon brand-coloured — it would vanish into the background.
    // Full white against the header's translucent white is the contrast here.
    filterIcon: (filtered: any) => (
      <SearchOutlined
        style={{ color: filtered ? "#ffffff" : undefined }}
      />
    ),
    onFilter: (value: any, record: any) => {
      const data = dataIndex
        .split(".")
        .reduce((acc: any, part: string) => acc?.[part], record);
      return data?.toString()?.toLowerCase()?.includes(value.toLowerCase());
    },
    render: (text: any) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#a8f0c0", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const getColumnSortProps = (dataIndex: string) => ({
    sorter: (a: any, b: any) => {
      const dataA = dataIndex
        .split(".")
        .reduce((acc: any, part: string) => acc?.[part], a);
      const dataB = dataIndex
        .split(".")
        .reduce((acc: any, part: string) => acc?.[part], b);

      const numA = parseInt(dataA?.toString().replace(/\D+/g, "") || "0", 10);
      const numB = parseInt(dataB?.toString().replace(/\D+/g, "") || "0", 10);
      return numA - numB;
    },
    sortDirections: ["descend", "ascend"],
    showSorterTooltip: false,
  });

  return { getColumnSearchProps, getColumnSortProps };
};
