import { useCallback, useEffect, useState } from "react";
import type { ServiceCatalogItem } from "../../data-types/ServiceCatalogItem";
import type { TicketField } from "../../../ticket-fields/data-types/TicketField";
import type { TicketFieldObject } from "../../../ticket-fields/data-types/TicketFieldObject";
import { getCustomObjectKey } from "../../../ticket-fields/fields/LookupField";

const getFieldValue = (field: TicketField) => {
  if (field.type === "tagger") {
    return (
      field.custom_field_options.find((option) => option.default)?.value ?? null
    );
  }
  return null;
};

const formatField = (field: TicketField): TicketFieldObject => {
  const {
    id,
    type,
    description,
    title_in_portal,
    custom_field_options,
    required_in_portal,
    relationship_target_type,
  } = field;
  return {
    id,
    type,
    name: `custom_fields_${id}`,
    description,
    label: title_in_portal,
    options: custom_field_options,
    required: required_in_portal,
    relationship_target_type,
    error: null,
    value: getFieldValue(field),
  };
};

const isAssociatedLookupField = (field: TicketField) => {
  const customObjectKey = getCustomObjectKey(
    field.relationship_target_type as string
  );
  if (customObjectKey === "standard::service_catalog_item") {
    return true;
  }
  return false;
};

interface FetchTicketFieldsResult {
  requestFields: TicketFieldObject[];
  associatedLookupField: TicketFieldObject | null;
}

const fetchTicketFields = async (
  form_id: number,
  baseLocale: string
): Promise<FetchTicketFieldsResult> => {
  const [formResponse, fieldsResponse] = await Promise.all([
    fetch(`/api/v2/ticket_forms/${form_id}`),
    fetch(`/api/v2/ticket_fields?locale=${baseLocale}`),
  ]);

  if (!formResponse.ok) {
    throw new Error("Error fetching form data");
  }
  if (!fieldsResponse.ok) {
    throw new Error("Error fetching fields data");
  }

  const formData = await formResponse.json();
  const fieldsData = await fieldsResponse.json();

  if (!formData.ticket_form.active) {
    throw new Error("Associated ticket form is not active");
  }

  const ids = formData.ticket_form.ticket_field_ids;
  const ticketFieldsData = fieldsData.ticket_fields;
  let associatedLookupField: TicketFieldObject | null = null;

  const requestFields = ids
    .map((id: number) => {
      const ticketField = ticketFieldsData.find(
        (field: TicketField) => field.id === id
      );
      if (
        ticketField &&
        ticketField.type !== "subject" &&
        ticketField.type !== "description" &&
        ticketField.editable_in_portal
      ) {
        if (
          ticketField.type === "lookup" &&
          isAssociatedLookupField(ticketField)
        ) {
          associatedLookupField = ticketField;

          return null;
        }
        return formatField(ticketField);
      }
      return null;
    })
    .filter(Boolean);
  if (!associatedLookupField) {
    throw new Error("Associated lookup field not found");
  }
  return { requestFields, associatedLookupField };
};

export function useItemFormFields(
  serviceCatalogItem: ServiceCatalogItem | undefined,
  baseLocale: string
) {
  const [requestFields, setRequestFields] = useState<TicketFieldObject[]>([]);
  const [associatedLookupField, setAssociatedLookupField] =
    useState<TicketFieldObject | null>();
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    const fetchAndSetFields = async () => {
      if (serviceCatalogItem && serviceCatalogItem.form_id) {
        try {
          const { requestFields, associatedLookupField } =
            await fetchTicketFields(serviceCatalogItem.form_id, baseLocale);
          setRequestFields(requestFields);
          setAssociatedLookupField(associatedLookupField);
        } catch (error) {
          setError(error);
        }
      }
    };

    fetchAndSetFields();
  }, [baseLocale, serviceCatalogItem]);

  const handleChange = useCallback(
    (field: TicketFieldObject, value: TicketFieldObject["value"]) => {
      setRequestFields(
        requestFields.map((ticketField) =>
          ticketField.name === field.name
            ? { ...ticketField, value }
            : ticketField
        )
      );
    },
    [requestFields]
  );

  return {
    requestFields,
    associatedLookupField,
    error,
    setRequestFields,
    handleChange,
  };
}
