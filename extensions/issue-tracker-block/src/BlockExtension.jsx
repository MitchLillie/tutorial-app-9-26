import {
  AdminBlock,
  Box,
  Button,
  Divider,
  Form,
  Icon,
  InlineStack,
  Select,
  Text,
  TextField,
  reactExtension,
  useApi,
} from "@shopify/ui-extensions-react/admin";
import { useEffect, useMemo, useState } from "react";
import { getIssues, updateIssues } from "./utils";

// The target used here must match the target used in the extension's .toml file at ./shopify.ui.extension.toml
const TARGET = "admin.product-details.block.render";

export default reactExtension(TARGET, () => <App />);

const PAGE_SIZE = 5;

function App() {
  const { navigation, data } = useApi(TARGET);
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState([]);
  const [issues, setIssues] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [text, setText] = useState('');

  const productId = data.selected[0].id;
  const issuesCount = issues.length;
  const totalPages = issuesCount / PAGE_SIZE;

  useEffect(() => {
    (async function getProductInfo() {
      // Load the product's metafield of type issues
      const productData = await getIssues(productId);

      setLoading(false);
      if (productData?.data?.product?.metafield?.value) {
        const parsedIssues = JSON.parse(
          productData.data.product.metafield.value
        );
        setInitialValues(
          parsedIssues.map(({ completed }) => Boolean(completed))
        );
        setIssues(parsedIssues);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    // Create a new array of issues leaving out the one that's being deleted
    const newIssues = issues.filter((issue) => issue.id !== id);
    // Save to the local state
    setIssues(newIssues);
    // Commit changes to the database
    await updateIssues(productId, newIssues);
  };

  const handleChange = async (id, value) => {
    // Update the local state of the extension to reflect changes
    setIssues((currentIssues) => {
      // Create a copy of the array so you don't mistakenly mutate the state
      const newIssues = [...currentIssues];
      // Find the index of the issue that you're interested in
      const editingIssueIndex = newIssues.findIndex(
        (listIssue) => listIssue.id == id
      );
      // Overwrite that item with the new value
      newIssues[editingIssueIndex] = {
        // Spread the previous item to retain the values that you're not changingt
        ...newIssues[editingIssueIndex],
        // Update the completed value
        completed: value === "completed" ? true : false,
      };
      return newIssues;
    });
  };

  const onSubmit = async () => {
    // Commit changes to the database
    await updateIssues(productId, issues);
  };

  const onReset = () => {};

  const paginatedIssues = useMemo(() => {
    if (issuesCount <= PAGE_SIZE) {
      // It's not necessary to paginate if there are fewer issues than the page size
      return issues;
    }

    // Slice the array after the last item of the previous page
    return [...issues].slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );
  }, [issues, currentPage]);

  if (loading) {
    return <></>;
  }

  const summary = `${issuesCount} ${issuesCount === 1 ? "issue" : "issues"}`

  return (
    <AdminBlock
      summary={summary}
    >
      <TextField
        label="Text field"
        onChange={(value) => {
            console.log('onChange', { value });
            setText(`${value}`);
        }}
    />

    {text == 'test' ? "State is 'test'" : `State is not 'test' (value is "${text}")`}
    </AdminBlock>
  );
}

/* A function to truncate long strings */
function truncate(str, n) {
  return str.length > n ? str.substr(0, n - 1) + "…" : str;
}
