package ai.opspilot.model;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.ArrayList;
import java.util.List;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final TypeReference<List<String>> TYPE = new TypeReference<>() {};

  @Override
  public String convertToDatabaseColumn(List<String> value) {
    try {
      return MAPPER.writeValueAsString(value == null ? List.of() : value);
    } catch (Exception e) {
      return "[]";
    }
  }

  @Override
  public List<String> convertToEntityAttribute(String value) {
    if (value == null || value.isBlank()) return new ArrayList<>();
    try {
      return MAPPER.readValue(value, TYPE);
    } catch (Exception e) {
      return new ArrayList<>();
    }
  }
}
