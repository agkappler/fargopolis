import { DropdownInput } from "@/components/inputs/DropdownInput";
import { ListInput } from "@/components/inputs/ListInput";
import { NumberInput, NumberInputType } from "@/components/inputs/NumberInput";
import { SwitchInput } from "@/components/inputs/SwitchInput";
import { TextInput } from "@/components/inputs/TextInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency } from "@/helpers/Format";
import { Box, Button, Divider, Grid, Paper, Typography } from "@mui/material";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

interface Person {
  name: string;
  total: number;
}
interface SharedItem {
  name: string;
  value: number;
  splitBy: string[];
}
interface CheckData {
  people: Person[];
  tipPercentage: number;
  taxAmount: number;
  sharedItems: SharedItem[];
  includeTaxInTip: boolean;
}

interface TotalInfo {
  name?: string;
  total: number;
  preTaxTotal: number;
  tax: number;
  subTotal: number;
  tip: number;
}

export function SplitCheckPage() {
  const EVERYBODY = "everybody";
  const defaultPerson = { name: "", total: 0 };
  const methods = useForm<CheckData>({
    defaultValues: { tipPercentage: 20, taxAmount: 0, sharedItems: [], people: [defaultPerson], includeTaxInTip: true },
  });
  const people = methods.watch("people");

  const [individualTotals, setIndividualTotals] = useState<TotalInfo[]>([]);
  const [totalInfo, setTotalInfo] = useState(0);
  const mapSharedItemsToPeople = (data: CheckData) => {
    return data.sharedItems.reduce(
      (map, sharedItem) => {
        let splitPeople = sharedItem.splitBy;
        if (sharedItem.splitBy.includes(EVERYBODY)) {
          splitPeople = data.people.map((person) => person.name);
        }

        const sharedItemValue = parseFloat(sharedItem.value.toString()) / splitPeople.length;
        splitPeople.forEach((person) => {
          if (!map[person]) {
            map[person] = 0;
          }
          map[person] = map[person] + sharedItemValue;
        });
        return map;
      },
      {} as Record<string, number>
    );
  };
  const onSubmit = (data: CheckData) => {
    const sharedItemTotalByPerson = mapSharedItemsToPeople(data);
    const itemTotal =
      Object.keys(sharedItemTotalByPerson).reduce((sum, personName) => sum + parseFloat(sharedItemTotalByPerson[personName].toString()), 0) +
      data.people.reduce((sum, person) => sum + parseFloat(person.total.toString()), 0);
    const taxPercentage = data.taxAmount / itemTotal;
    const tipPercentage = data.tipPercentage / 100;

    const calculatedTotals = data.people.map((person: Person) => {
      const preTaxTotal = parseFloat(person.total.toString()) + (sharedItemTotalByPerson[person.name] || 0);
      const tax = preTaxTotal * taxPercentage;
      const subTotal = preTaxTotal + tax;
      const tip = (data.includeTaxInTip ? subTotal : preTaxTotal) * tipPercentage;
      const adjustedTotal = subTotal + tip;
      return { name: person.name, total: adjustedTotal, preTaxTotal, tax, subTotal, tip };
    });
    setIndividualTotals(calculatedTotals);
    setTotalInfo(calculatedTotals.reduce((sum, person) => sum + person.total, 0));
  };

  return (
    <>
      <PageHeader title="Check Splitter" />
      <FormProvider {...methods}>
        <Grid container spacing={2} rowGap={2} className="m-2 p-2">
          <Grid size={12}>
            <ListInput
              title="People"
              fieldName="people"
              addText="Add Person"
              defaultItem={defaultPerson}
              listItemComponent={({ idx, removeButton }) => (
                <Grid container spacing={1} key={idx} alignItems="center" marginBottom={2}>
                  <Grid size={6}>
                    <TextInput label="Name" fieldName={`people[${idx}].name`} requiredMessage="Feature name is required" />
                  </Grid>
                  <Grid size={5}>
                    <NumberInput
                      label="Total"
                      fieldName={`people[${idx}].total`}
                      requiredMessage="Total is required"
                      type={NumberInputType.Currency}
                    />
                  </Grid>
                  <Grid size={1}>{removeButton}</Grid>
                </Grid>
              )}
            />
          </Grid>
          <Grid size={12}>
            <ListInput
              title="Shared Items"
              fieldName="sharedItems"
              addText="Add Shared Item"
              defaultItem={{ name: "", value: 0, splitBy: [EVERYBODY] }}
              listItemComponent={({ idx, removeButton }) => (
                <Grid container spacing={1} key={idx} alignItems="center" marginBottom={2}>
                  <Grid size={4}>
                    <TextInput label="Name" fieldName={`sharedItems[${idx}].name`} requiredMessage="Shared item name is required" />
                  </Grid>
                  <Grid size={3}>
                    <NumberInput
                      label="Value"
                      fieldName={`sharedItems[${idx}].value`}
                      requiredMessage="Value is required"
                      type={NumberInputType.Currency}
                    />
                  </Grid>
                  <Grid size={4}>
                    <DropdownInput
                      label="Split By"
                      fieldName={`sharedItems[${idx}].splitBy`}
                      options={[
                        { value: EVERYBODY, label: "Everybody" },
                        ...people.map((p, i) => ({ value: p.name || `Person ${i + 1}`, label: p.name || `Person ${i + 1}` })),
                      ]}
                      requiredMessage="Split By is required"
                      isMultiSelect={true}
                    />
                  </Grid>
                  <Grid size={1}>{removeButton}</Grid>
                </Grid>
              )}
            />
          </Grid>
          <Grid size={12}>
            <Typography variant="h6" gutterBottom>
              Add-Ons
            </Typography>
          </Grid>
          <Grid size={4}>
            <NumberInput label="Tax Amount" fieldName="taxAmount" type={NumberInputType.Currency} />
          </Grid>
          <Grid size={4}>
            <NumberInput label="Tip Percentage" fieldName="tipPercentage" type={NumberInputType.Percentage} />
          </Grid>
          <Grid size={4} className="flex items-center">
            <SwitchInput label="Include Tax in Tip" fieldName="includeTaxInTip" />
          </Grid>
        </Grid>
        <Button role="submit" onClick={methods.handleSubmit(onSubmit)} variant="contained" color="primary" sx={{ margin: 2 }}>
          Calculate Totals
        </Button>
      </FormProvider>
      {individualTotals.length > 0 && (
        <Box margin={2}>
          <Typography variant="h5">Total: {formatCurrency(totalInfo)}</Typography>
          <Divider />
          <Grid container spacing={1} marginTop={1}>
            {individualTotals.map((person) => (
              <Grid size={3} key={person.name}>
                <Paper elevation={3} className="p-2">
                  <Typography variant="h6" textAlign="center">
                    {person.name}: {formatCurrency(person.total)}
                  </Typography>
                  <Typography variant="body1">Pre-tax Total: {formatCurrency(person.preTaxTotal)}</Typography>
                  <Typography variant="body1">Tax: {formatCurrency(person.tax)}</Typography>
                  <Typography variant="body1">Sub Total: {formatCurrency(person.subTotal)}</Typography>
                  <Typography variant="body1">Tip: {formatCurrency(person.tip)}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </>
  );
}
