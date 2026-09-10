import { DropdownInput } from "@/components/inputs/DropdownInput";
import { ListInput } from "@/components/inputs/ListInput";
import { NumberInput, NumberInputType } from "@/components/inputs/NumberInput";
import { SwitchInput } from "@/components/inputs/SwitchInput";
import { TextInput } from "@/components/inputs/TextInput";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatCurrency } from "@/helpers/Format";
import { Box, Button, Grid, GridItem, Heading, Separator, Text } from "@chakra-ui/react";
import { surfaceCardProps } from "@/components/ui/surfaceStyle";
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
        <Grid templateColumns="repeat(12, 1fr)" gap={4} className="m-2 p-2">
          <GridItem colSpan={12}>
            <ListInput
              title="People"
              fieldName="people"
              addText="Add Person"
              defaultItem={defaultPerson}
              listItemComponent={({ idx, removeButton }) => (
                <Grid templateColumns="repeat(12, 1fr)" gap={2} key={idx} alignItems="center" marginBottom={4}>
                  <GridItem colSpan={6}>
                    <TextInput label="Name" fieldName={`people[${idx}].name`} requiredMessage="Feature name is required" />
                  </GridItem>
                  <GridItem colSpan={5}>
                    <NumberInput
                      label="Total"
                      fieldName={`people[${idx}].total`}
                      requiredMessage="Total is required"
                      type={NumberInputType.Currency}
                    />
                  </GridItem>
                  <GridItem colSpan={1}>{removeButton}</GridItem>
                </Grid>
              )}
            />
          </GridItem>
          <GridItem colSpan={12}>
            <ListInput
              title="Shared Items"
              fieldName="sharedItems"
              addText="Add Shared Item"
              defaultItem={{ name: "", value: 0, splitBy: [EVERYBODY] }}
              listItemComponent={({ idx, removeButton }) => (
                <Grid templateColumns="repeat(12, 1fr)" gap={2} key={idx} alignItems="center" marginBottom={4}>
                  <GridItem colSpan={4}>
                    <TextInput label="Name" fieldName={`sharedItems[${idx}].name`} requiredMessage="Shared item name is required" />
                  </GridItem>
                  <GridItem colSpan={3}>
                    <NumberInput
                      label="Value"
                      fieldName={`sharedItems[${idx}].value`}
                      requiredMessage="Value is required"
                      type={NumberInputType.Currency}
                    />
                  </GridItem>
                  <GridItem colSpan={4}>
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
                  </GridItem>
                  <GridItem colSpan={1}>{removeButton}</GridItem>
                </Grid>
              )}
            />
          </GridItem>
          <GridItem colSpan={12}>
            <Heading size="md" mb={2}>
              Add-Ons
            </Heading>
          </GridItem>
          <GridItem colSpan={{ base: 12, sm: 4 }}>
            <NumberInput label="Tax Amount" fieldName="taxAmount" type={NumberInputType.Currency} />
          </GridItem>
          <GridItem colSpan={{ base: 12, sm: 4 }}>
            <NumberInput label="Tip Percentage" fieldName="tipPercentage" type={NumberInputType.Percentage} />
          </GridItem>
          <GridItem colSpan={{ base: 12, sm: 4 }} className="flex items-center">
            <SwitchInput label="Include Tax in Tip" fieldName="includeTaxInTip" />
          </GridItem>
        </Grid>
        <Button role="submit" onClick={methods.handleSubmit(onSubmit)} variant="primary" m={2}>
          Calculate Totals
        </Button>
      </FormProvider>
      {individualTotals.length > 0 && (
        <Box margin={2}>
          <Heading size="lg">Total: {formatCurrency(totalInfo)}</Heading>
          <Separator />
          <Grid templateColumns="repeat(12, 1fr)" gap={2} marginTop={1}>
            {individualTotals.map((person) => (
              <GridItem colSpan={{ base: 12, sm: 6, md: 3 }} key={person.name}>
                <Box {...surfaceCardProps} boxShadow="md" className="p-2">
                  <Heading size="md" textAlign="center">
                    {person.name}: {formatCurrency(person.total)}
                  </Heading>
                  <Text>Pre-tax Total: {formatCurrency(person.preTaxTotal)}</Text>
                  <Text>Tax: {formatCurrency(person.tax)}</Text>
                  <Text>Sub Total: {formatCurrency(person.subTotal)}</Text>
                  <Text>Tip: {formatCurrency(person.tip)}</Text>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Box>
      )}
    </>
  );
}
